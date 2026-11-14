import { useCallback, useEffect, useState } from "react";
import { formatUnits, parseUnits } from "ethers";
import { getContracts } from "../contracts/contracts";
import { shortenAddress } from "../hooks/useWallet";

const EXAMPLE_ACCOUNTS = [
  {
    label: "Account #0 (deployer / owner)",
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  },
  {
    label: "Account #1 (example faculty)",
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  },
  {
    label: "Account #2 (example student body)",
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
  },
];

export default function TokenDashboard({
  account,
  chainId,
  isConnected,
  isHardhat,
}) {
  const [overview, setOverview] = useState(null);
  const [holders, setHolders] = useState([]);
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [recipient, setRecipient] = useState(
    "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
  );
  const [amount, setAmount] = useState("100000");
  const [busy, setBusy] = useState(false);
  const [txMessage, setTxMessage] = useState("");

  const isOwner =
    owner && account && owner.toLowerCase() === account.toLowerCase();

  const refresh = useCallback(async () => {
    setError("");
    setTxMessage("");
    if (!isConnected || !isHardhat || !account) {
      setOverview(null);
      setHolders([]);
      setOwner(null);
      return;
    }

    try {
      setLoading(true);
      const { token } = await getContracts(chainId, false);
      const [totalSupply, balance, percentage, ownerAddr, symbol] =
        await Promise.all([
          token.totalSupply(),
          token.balanceOf(account),
          token.ownershipPercentage(account),
          token.owner(),
          token.symbol(),
        ]);

      setOwner(ownerAddr);
      setOverview({
        totalSupply: formatUnits(totalSupply, 18),
        balance: formatUnits(balance, 18),
        percentage: Number(percentage),
        symbol,
      });

      const rows = [];
      for (const example of EXAMPLE_ACCOUNTS) {
        const [bal, pct] = await Promise.all([
          token.balanceOf(example.address),
          token.ownershipPercentage(example.address),
        ]);
        rows.push({
          ...example,
          balance: formatUnits(bal, 18),
          percentage: Number(pct),
        });
      }
      setHolders(rows);
    } catch (err) {
      setError(err?.shortMessage || err?.message || "Could not load dashboard");
    } finally {
      setLoading(false);
    }
  }, [account, chainId, isConnected, isHardhat]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleDistribute(event) {
    event.preventDefault();
    setError("");
    setTxMessage("");

    if (!isOwner) {
      setError(
        "Only the contract owner can distribute shares. Your wallet is not the owner."
      );
      return;
    }

    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }

    if (!/^0x[0-9a-fA-F]{40}$/.test(recipient.trim())) {
      setError("Enter a valid wallet address (0x + 40 hex characters).");
      return;
    }

    try {
      setBusy(true);
      const { token } = await getContracts(chainId, true);
      const wei = parseUnits(String(amount), 18);
      const ownerBal = await token.balanceOf(account);
      if (wei > ownerBal) {
        setError("Insufficient ALUT balance for this transfer.");
        return;
      }

      const tx = await token.distributeShares(recipient.trim(), wei);
      await tx.wait();
      setTxMessage(
        `Sent ${amount} ALUT to ${shortenAddress(recipient.trim())}.`
      );
      await refresh();
    } catch (err) {
      const message = err?.reason || err?.shortMessage || err?.message || "";
      const lower = message.toLowerCase();
      if (err?.code === 4001 || err?.code === "ACTION_REJECTED") {
        setError("You rejected the transaction in MetaMask.");
      } else if (lower.includes("ownable")) {
        setError(
          "Contract rejected the call: only the owner can use distributeShares()."
        );
      } else if (lower.includes("coalesce") || lower.includes("user rejected")) {
        setError(
          "MetaMask did not finish the transaction. Close any MetaMask ads (Transaction Shield), click Confirm, or use MetaMask → Settings → Advanced → Clear activity and nonce data, then try again."
        );
      } else {
        setError(message || "Distribution failed.");
      }
    } finally {
      setBusy(false);
    }
  }

  if (!isConnected) {
    return (
      <section className="card">
        <h1>Token dashboard</h1>
        <p>Connect your wallet on Hardhat Local to see ALUT ownership.</p>
      </section>
    );
  }

  if (!isHardhat) {
    return (
      <section className="card">
        <h1>Token dashboard</h1>
        <div className="banner warn">
          Switch MetaMask to Hardhat Local (31337) to load balances.
        </div>
      </section>
    );
  }

  return (
    <section className="card">
      <h1>Token dashboard</h1>
      <p>
        Data is read from ALULogoToken. Total supply is fixed at 1,000,000 ALUT.
        Percentages come from <code>ownershipPercentage()</code>.
      </p>

      {loading && <p className="muted">Loading…</p>}
      {error && <div className="banner error">{error}</div>}
      {txMessage && <div className="banner ok-banner">{txMessage}</div>}

      {overview && (
        <div className="dash-grid">
          <div className="dash-stat">
            <span>Total supply</span>
            <strong>
              {Number(overview.totalSupply).toLocaleString()} ALUT
            </strong>
          </div>
          <div className="dash-stat">
            <span>Your balance</span>
            <strong>{Number(overview.balance).toLocaleString()} ALUT</strong>
          </div>
          <div className="dash-stat">
            <span>Your ownership</span>
            <strong>{overview.percentage}%</strong>
          </div>
        </div>
      )}

      <h2>Example holders</h2>
      <div className="table-wrap">
        <table className="holders">
          <thead>
            <tr>
              <th>Who</th>
              <th>Address</th>
              <th>Balance</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            {holders.map((row) => (
              <tr key={row.address}>
                <td>{row.label}</td>
                <td>
                  <code>{shortenAddress(row.address)}</code>
                </td>
                <td>{Number(row.balance).toLocaleString()}</td>
                <td>{row.percentage}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button type="button" className="btn ghost" onClick={refresh}>
        Refresh balances
      </button>

      <h2>Distribute shares</h2>
      {isOwner ? (
        <form className="register-form" onSubmit={handleDistribute}>
          <p className="muted">
            Owner wallet detected. This calls{" "}
            <code>distributeShares(recipient, amount)</code>.
          </p>
          <label>
            Recipient address
            <input
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x…"
            />
          </label>
          <label>
            Amount (ALUT)
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="100000"
            />
          </label>
          <button type="submit" className="btn primary" disabled={busy}>
            {busy ? "Confirm in MetaMask…" : "Distribute ALUT"}
          </button>
        </form>
      ) : (
        <div className="banner warn">
          Distribution is limited to the contract owner. Connected wallet{" "}
          <code>{shortenAddress(account)}</code> is not the owner
          {owner ? (
            <>
              {" "}
              (<code>{shortenAddress(owner)}</code>).
            </>
          ) : (
            "."
          )}
        </div>
      )}
    </section>
  );
}
