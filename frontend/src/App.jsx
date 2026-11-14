import { useState } from "react";
import { useWallet, shortenAddress } from "./hooks/useWallet";
import { useTokenData } from "./hooks/useTokenData";
import LogoUploader from "./components/LogoUploader";
import RegisterAssetForm from "./components/RegisterAssetForm";
import VerifyLogoPage from "./components/VerifyLogoPage";
import TokenDashboard from "./components/TokenDashboard";
import "./App.css";

function App() {
  const [page, setPage] = useState("verify");

  const {
    account,
    chainId,
    error: walletError,
    connecting,
    switching,
    hasMetaMask,
    connect,
    disconnect,
    switchToHardhat,
    isConnected,
    isHardhat,
  } = useWallet();

  const {
    data: tokenData,
    loading: tokenLoading,
    error: tokenError,
    refresh,
  } = useTokenData(account, chainId, isConnected);

  const [hashInfo, setHashInfo] = useState({ hash: "", file: null });

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">ALU</span>
          <div>
            <strong>Logo Registry dApp</strong>
            <p>Protect and verify the official ALU logo on Ethereum</p>
          </div>
        </div>

        <nav className="nav">
          <button
            type="button"
            className={page === "verify" ? "active" : ""}
            onClick={() => setPage("verify")}
          >
            Verify
          </button>
          <button
            type="button"
            className={page === "register" ? "active" : ""}
            onClick={() => setPage("register")}
          >
            Register
          </button>
          <button
            type="button"
            className={page === "dashboard" ? "active" : ""}
            onClick={() => setPage("dashboard")}
          >
            Dashboard
          </button>
        </nav>

        <div className="wallet-area">
          {!isConnected ? (
            <button
              type="button"
              className="btn primary"
              onClick={connect}
              disabled={connecting}
            >
              {connecting ? "Connecting…" : "Connect Wallet"}
            </button>
          ) : (
            <div className="wallet-connected">
              <div className="wallet-chip" title={account}>
                <span className="dot" />
                {shortenAddress(account)}
              </div>
              {tokenData && (
                <div className="balance-chip">
                  {Number(tokenData.balance).toLocaleString()} {tokenData.symbol}
                </div>
              )}
              <button type="button" className="btn ghost" onClick={disconnect}>
                Disconnect
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="content">
        {page === "verify" && <VerifyLogoPage />}

        {page === "dashboard" && (
          <TokenDashboard
            account={account}
            chainId={chainId}
            isConnected={isConnected}
            isHardhat={isHardhat}
          />
        )}

        {page === "register" && (
          <>
            <section className="card">
              <h1>Wallet</h1>
              <p>
                Connect on Hardhat Local to register a logo. The Verify tab
                works without a wallet.
              </p>

              {!hasMetaMask && (
                <div className="banner warn">
                  MetaMask was not detected. Install it from{" "}
                  <a
                    href="https://metamask.io"
                    target="_blank"
                    rel="noreferrer"
                  >
                    metamask.io
                  </a>
                  .
                </div>
              )}

              {walletError && <div className="banner error">{walletError}</div>}
              {tokenError && <div className="banner warn">{tokenError}</div>}

              {isConnected && !isHardhat && (
                <div className="banner warn">
                  <p>Switch to Hardhat Local for registration and balances.</p>
                  <button
                    type="button"
                    className="btn primary"
                    onClick={switchToHardhat}
                    disabled={switching}
                    style={{ marginTop: "0.75rem" }}
                  >
                    {switching ? "Switching…" : "Switch to Hardhat Local"}
                  </button>
                </div>
              )}

              {isConnected ? (
                <div className="status ok">
                  <dl className="facts">
                    <div>
                      <dt>Address</dt>
                      <dd>
                        <code>{shortenAddress(account)}</code>
                      </dd>
                    </div>
                    <div>
                      <dt>Chain</dt>
                      <dd>
                        <code>{chainId}</code>
                        {isHardhat ? " — Hardhat local" : ""}
                      </dd>
                    </div>
                    <div>
                      <dt>ALUT balance</dt>
                      <dd>
                        {tokenLoading
                          ? "Loading…"
                          : tokenData
                            ? `${tokenData.balance} ALUT (${tokenData.percentage}%)`
                            : "—"}
                      </dd>
                    </div>
                  </dl>
                  <button type="button" className="btn ghost" onClick={refresh}>
                    Refresh
                  </button>
                </div>
              ) : (
                <div className="status idle">
                  <p>Connect wallet to register a logo or view ALUT balance.</p>
                </div>
              )}
            </section>

            <LogoUploader onHashReady={setHashInfo} />
            <RegisterAssetForm
              hash={hashInfo.hash}
              file={hashInfo.file}
              chainId={chainId}
              isConnected={isConnected}
              isHardhat={isHardhat}
            />
          </>
        )}
      </main>
    </div>
  );
}

export default App;
