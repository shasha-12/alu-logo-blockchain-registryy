import { useCallback, useEffect, useState } from "react";
import { getAddressesForChain, readTokenOverview } from "../contracts/contracts";

export function useTokenData(account, chainId, isConnected) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!isConnected || !account || !chainId) {
      setData(null);
      setError(null);
      return;
    }

    const entry = getAddressesForChain(chainId);
    if (!entry?.ALULogoToken) {
      setData(null);
      setError(
        `Contracts are not deployed on chain ${chainId} yet. For local work: start Hardhat node, deploy, switch MetaMask to Localhost 8545, then refresh.`
      );
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const overview = await readTokenOverview(chainId, account);
      setData(overview);
    } catch (err) {
      setData(null);
      setError(err?.shortMessage || err?.message || "Could not read token data");
    } finally {
      setLoading(false);
    }
  }, [account, chainId, isConnected]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, error, refresh };
}
