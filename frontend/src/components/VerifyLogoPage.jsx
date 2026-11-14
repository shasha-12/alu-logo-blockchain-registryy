import { useState } from "react";
import { getReadOnlyRegistry } from "../contracts/contracts";
import { OFFICIAL_LOGO_HASH, sha256FileToBytes32 } from "../utils/hashFile";

export default function VerifyLogoPage() {
  const [mode, setMode] = useState("file");
  const [tokenId, setTokenId] = useState("1");
  const [pastedHash, setPastedHash] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [outcome, setOutcome] = useState(null);

  async function runVerify(contentHash) {
    setError("");
    setOutcome(null);

    if (!contentHash || !/^0x[0-9a-fA-F]{64}$/.test(contentHash.trim())) {
      setError(
        "Hash must look like 0x followed by 64 hex characters (bytes32)."
      );
      return;
    }

    try {
      setBusy(true);
      const { registry } = getReadOnlyRegistry(31337);
      const id = BigInt(tokenId || "1");
      const [isAuthentic, message] = await registry.verifyLogoIntegrity(
        id,
        contentHash.trim()
      );

      let metadata = null;
      if (isAuthentic) {
        const asset = await registry.getAsset(id);
        metadata = {
          name: asset.name,
          fileType: asset.fileType,
          contentHash: asset.contentHash,
          registrant: asset.registrant,
          timestamp: Number(asset.timestamp),
        };
      }

      setOutcome({
        isAuthentic: Boolean(isAuthentic),
        message,
        contentHash: contentHash.trim(),
        metadata,
      });
    } catch (err) {
      const msg = err?.shortMessage || err?.message || "Verification failed.";
      if (msg.toLowerCase().includes("nonexistent") || msg.includes("ERC721")) {
        setError(
          "That token ID does not exist. Use token ID 1 for the official logo, and keep the Hardhat node running."
        );
      } else if (
        msg.toLowerCase().includes("failed to fetch") ||
        msg.includes("ECONNREFUSED")
      ) {
        setError(
          "Cannot reach Hardhat at http://127.0.0.1:8545. Run: npx hardhat node"
        );
      } else {
        setError(msg);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleFile(event) {
    const file = event.target.files?.[0];
    setOutcome(null);
    setError("");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");

    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    try {
      setBusy(true);
      const hash = await sha256FileToBytes32(file);
      await runVerify(hash);
    } catch (err) {
      setError(err?.message || "Could not hash file.");
      setBusy(false);
    }
  }

  function handleHashSubmit(event) {
    event.preventDefault();
    runVerify(pastedHash || OFFICIAL_LOGO_HASH);
  }

  return (
    <section className="card verify-card">
      <h1>Verify an ALU logo</h1>
      <p>
        No wallet is required. The page hashes the file locally, then calls{" "}
        <code>verifyLogoIntegrity</code> as a read-only contract call.
      </p>

      <div className="mode-tabs">
        <button
          type="button"
          className={`btn ${mode === "file" ? "primary" : "ghost"}`}
          onClick={() => setMode("file")}
        >
          Upload file
        </button>
        <button
          type="button"
          className={`btn ${mode === "hash" ? "primary" : "ghost"}`}
          onClick={() => setMode("hash")}
        >
          Paste hash
        </button>
      </div>

      <label className="token-id-label">
        Token ID to check against
        <input
          value={tokenId}
          onChange={(e) => setTokenId(e.target.value)}
          placeholder="1"
        />
        <span className="muted">Use 1 for the official logo from deploy.</span>
      </label>

      {mode === "file" ? (
        <label className="file-label">
          <span>Upload logo to verify</span>
          <input type="file" accept="image/*" onChange={handleFile} />
        </label>
      ) : (
        <form className="register-form" onSubmit={handleHashSubmit}>
          <label>
            SHA-256 hash (bytes32)
            <input
              value={pastedHash}
              onChange={(e) => setPastedHash(e.target.value)}
              placeholder={OFFICIAL_LOGO_HASH}
            />
          </label>
          <button type="submit" className="btn primary" disabled={busy}>
            {busy ? "Checking…" : "Verify hash"}
          </button>
        </form>
      )}

      {previewUrl && (
        <img src={previewUrl} alt="File to verify" className="preview" />
      )}

      {busy && <p className="muted">Checking the blockchain…</p>}
      {error && <div className="banner error">{error}</div>}

      {outcome?.isAuthentic && (
        <div className="verify-result success">
          <div className="verify-icon">✓</div>
          <div>
            <h2>Logo Verified</h2>
            <p>This is the authentic ALU logo registered on the blockchain.</p>
            {outcome.metadata && (
              <dl className="facts">
                <div>
                  <dt>Asset name</dt>
                  <dd>{outcome.metadata.name}</dd>
                </div>
                <div>
                  <dt>File type</dt>
                  <dd>{outcome.metadata.fileType}</dd>
                </div>
                <div>
                  <dt>Registered by</dt>
                  <dd>
                    <code>{outcome.metadata.registrant}</code>
                  </dd>
                </div>
                <div>
                  <dt>Registration date</dt>
                  <dd>
                    {new Date(
                      outcome.metadata.timestamp * 1000
                    ).toLocaleString()}
                  </dd>
                </div>
              </dl>
            )}
          </div>
        </div>
      )}

      {outcome && !outcome.isAuthentic && (
        <div className="verify-result fail">
          <div className="verify-icon">!</div>
          <div>
            <h2>Warning: This logo has been modified</h2>
            <p>
              The file does not match the official logo stored on-chain. Do not
              treat it as the authentic ALU mark.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
