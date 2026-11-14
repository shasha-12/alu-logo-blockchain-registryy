import { useCallback, useEffect, useState } from "react";
import { BrowserProvider } from "ethers";

const HARDHAT_CHAIN_ID = 31337;
const HARDHAT_HEX = "0x7a69";

function getEthereum() {
  if (typeof window === "undefined") return null;
  const { ethereum } = window;
  if (!ethereum) return null;
  if (ethereum.providers?.length) {
    return (
      ethereum.providers.find((p) => p.isMetaMask) || ethereum.providers[0]
    );
  }
  return ethereum;
}

export function shortenAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

async function readChainId(eth) {
  const hex = await eth.request({ method: "eth_chainId" });
  return Number.parseInt(hex, 16);
}

export function useWallet() {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [error, setError] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [switching, setSwitching] = useState(false);

  const ethereum = getEthereum();
  const hasMetaMask = Boolean(ethereum?.isMetaMask || ethereum);

  const syncFromWallet = useCallback(async () => {
    const eth = getEthereum();
    if (!eth) return;
    const accounts = await eth.request({ method: "eth_accounts" });
    const id = await readChainId(eth);
    setAccount(accounts[0] ?? null);
    setChainId(id);
  }, []);

  const connect = useCallback(async () => {
    setError(null);
    const eth = getEthereum();
    if (!eth) {
      setError(
        "No Web3 wallet found. Install MetaMask from https://metamask.io then refresh this page."
      );
      return;
    }
    try {
      setConnecting(true);
      const accounts = await eth.request({ method: "eth_requestAccounts" });
      const id = await readChainId(eth);
      setAccount(accounts[0] ?? null);
      setChainId(id);
    } catch (err) {
      if (err?.code === 4001) {
        setError("You rejected the connection request in MetaMask.");
      } else {
        setError(err?.message || "Could not connect to MetaMask.");
      }
    } finally {
      setConnecting(false);
    }
  }, []);

  const switchToHardhat = useCallback(async () => {
    setError(null);
    const eth = getEthereum();
    if (!eth) {
      setError("MetaMask not found.");
      return;
    }
    try {
      setSwitching(true);
      await eth.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: HARDHAT_HEX }],
      });
      await syncFromWallet();
    } catch (err) {
      if (err?.code === 4902 || err?.code === -32603) {
        try {
          await eth.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: HARDHAT_HEX,
                chainName: "Hardhat Local",
                nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
                rpcUrls: ["http://127.0.0.1:8545"],
              },
            ],
          });
          await syncFromWallet();
        } catch (addErr) {
          setError(addErr?.message || "Could not add Hardhat Local.");
        }
      } else if (err?.code === 4001) {
        setError("You rejected the network switch in MetaMask.");
      } else {
        setError(err?.message || "Could not switch network.");
      }
    } finally {
      setSwitching(false);
    }
  }, [syncFromWallet]);

  const disconnect = useCallback(() => {
    setAccount(null);
    setError(null);
  }, []);

  useEffect(() => {
    const eth = getEthereum();
    if (!eth) return;
    syncFromWallet().catch(() => {});
    const onAccountsChanged = () => {
      syncFromWallet().catch(() => {});
    };
    const onChainChanged = () => {
      window.location.reload();
    };
    eth.on?.("accountsChanged", onAccountsChanged);
    eth.on?.("chainChanged", onChainChanged);
    return () => {
      eth.removeListener?.("accountsChanged", onAccountsChanged);
      eth.removeListener?.("chainChanged", onChainChanged);
    };
  }, [syncFromWallet]);

  return {
    account,
    chainId,
    error,
    connecting,
    switching,
    hasMetaMask,
    connect,
    disconnect,
    switchToHardhat,
    isConnected: Boolean(account),
    isHardhat: chainId === HARDHAT_CHAIN_ID,
  };
}

export function getBrowserProvider() {
  const eth = getEthereum();
  if (!eth) throw new Error("MetaMask not found");
  return new BrowserProvider(eth);
}
