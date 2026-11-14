import { useEffect, useState } from "react";
import { getContracts } from "../contracts/contracts";

export default function RegisterAssetForm({
  hash,
  file,
  chainId,
  isConnected,
  isHardhat,
}) {
  const [name, setName] = useState("ALU Official Logo");
  const [fileType, setFileType] = useState(file?.type || "image/png");
  const [busy, setBusy] = useState(false);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setFileType(file?.type || "image/png");
  }, [file]);

  useEffect(() => {
    let cancelled = false;

    async function checkDuplicate() {
      setAlreadyRegistered(false);
      setResult(null);
      setError("");
      if (!hash || !isConnected || !isHardhat) return;

      try {
        const { registry } = await getContracts(chainId, false);
        const used = await registry.registeredHashes(hash);
        if (!cancelled) setAlreadyRegistered(Boolean(used));
      } catch {
      }
    }

    checkDuplicate();
    return () => {
      cancelled = true;
    };
  }, [hash, chainId, isConnected, isHardhat]);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setResult(null);

    if (!isConnected) {
      setError("Connect your wallet first.");
      return;
    }
    if (!isHardhat) {
      setError("Switch MetaMask to Hardhat Local (31337) first.");
      return;
    }
    if (!hash) {
      setError("Hash a file first.");
      return;
    }
    if (!name.trim() || !fileType.trim()) {
      setError("Name and file type are required.");
      return;
    }

    try {
      setBusy(true);
      const { registry } = await getContracts(chainId, true);
      const tx = await registry.registerAsset(name.trim(), fileType.trim(), hash);
      const receipt = await tx.wait();

      let tokenId = null;
      for (const log of receipt.logs) {
        try {
          const parsed = registry.interface.parseLog(log);
          if (parsed?.name === "AssetRegistered") {
            tokenId = parsed.args.tokenId.toString();
            break;
          }
        } catch {
        }
      }

      setResult({
        tokenId: tokenId || "(see Hardhat logs)",
        txHash: receipt.hash,
      });
      setAlreadyRegistered(true);
    } catch (err) {
      const message = err?.reason || err?.shortMessage || err?.message || "";
      if (
        message.toLowerCase().includes("already registered") ||
        message.toLowerCase().includes("duplicate")
      ) {
        setError(
          "This hash is already registered. The contract rejected the duplicate."
        );
        setAlreadyRegistered(true);
      } else if (err?.code === 4001 || err?.code === "ACTION_REJECTED") {
        setError("You rejected the transaction in MetaMask.");
      } else {
        setError(message || "Registration failed.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (!hash) return null;

  return (
    <section className="card">
      <h1>Register asset</h1>
      <p>
        Calls <code>registerAsset</code> on ALUAssetRegistry. MetaMask will ask
        you to confirm the transaction.
      </p>

      {alreadyRegistered && (
        <div className="banner warn">
          This hash is already on the registry (the official logo is token ID 1
          after deploy). Submitting it again should fail. Use a different image
          to mint a new token.
        </div>
      )}

      <form className="register-form" onSubmit={handleSubmit}>
        <label>
          Asset name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ALU Official Logo"
          />
        </label>
        <label>
          File type
          <input
            value={fileType}
            onChange={(e) => setFileType(e.target.value)}
            placeholder="image/png"
          />
        </label>
        <label>
          Content hash
          <input value={hash} readOnly />
        </label>
        <button
          type="submit"
          className="btn primary"
          disabled={busy || !isConnected || !isHardhat}
        >
          {busy ? "Confirm in MetaMask…" : "Register asset"}
        </button>
      </form>

      {error && <div className="banner error">{error}</div>}

      {result && (
        <div className="status ok">
          <h2>Registered</h2>
          <dl className="facts">
            <div>
              <dt>New token ID</dt>
              <dd>
                <code>{result.tokenId}</code>
              </dd>
            </div>
            <div>
              <dt>Transaction</dt>
              <dd>
                <code>{result.txHash}</code>
              </dd>
            </div>
          </dl>
        </div>
      )}
    </section>
  );
}
