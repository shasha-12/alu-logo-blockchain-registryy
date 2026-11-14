import { useEffect, useState } from "react";
import { OFFICIAL_LOGO_HASH, sha256FileToBytes32 } from "../utils/hashFile";

export default function LogoUploader({ onHashReady }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [hash, setHash] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handleFileChange(event) {
    const next = event.target.files?.[0];
    setError("");
    setHash("");
    onHashReady?.({ hash: "", file: null });

    if (!next) {
      setFile(null);
      setPreviewUrl("");
      return;
    }

    if (!next.type.startsWith("image/")) {
      setError("Please choose an image file (PNG, JPG, etc.).");
      return;
    }

    setFile(next);
    setPreviewUrl(URL.createObjectURL(next));

    try {
      setBusy(true);
      const value = await sha256FileToBytes32(next);
      setHash(value);
      onHashReady?.({ hash: value, file: next });
    } catch (err) {
      setError(err?.message || "Could not hash this file.");
    } finally {
      setBusy(false);
    }
  }

  const matchesOfficial = hash && hash.toLowerCase() === OFFICIAL_LOGO_HASH;

  return (
    <section className="card">
      <h1>Upload and hash</h1>
      <p>
        Select an image. The browser computes a SHA-256 fingerprint with the Web
        Crypto API. The file is not uploaded to any server.
      </p>

      <label className="file-label">
        <span>Choose image</span>
        <input type="file" accept="image/*" onChange={handleFileChange} />
      </label>

      {busy && <p className="muted">Hashing…</p>}
      {error && <div className="banner error">{error}</div>}

      {previewUrl && (
        <div className="preview-block">
          <p className="muted">Preview</p>
          <img src={previewUrl} alt="Selected logo preview" className="preview" />
          <p className="muted">
            {file?.name} · {file?.type} · {file?.size} bytes
          </p>
        </div>
      )}

      {hash && (
        <div className="status ok">
          <h2>SHA-256 (bytes32)</h2>
          <code className="hash-line">{hash}</code>
          {matchesOfficial ? (
            <p className="match ok-text">
              Matches the official ALU logo hash from Formative 1.
            </p>
          ) : (
            <p className="match warn-text">
              Different from the official registered hash.
            </p>
          )}
        </div>
      )}
    </section>
  );
}
