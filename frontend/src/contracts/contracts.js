import {
  BrowserProvider,
  Contract,
  JsonRpcProvider,
  formatUnits,
} from "ethers";
import registryAbi from "./ALUAssetRegistryABI.json";
import tokenAbi from "./ALULogoTokenABI.json";
import addresses from "./addresses.json";

const HARDHAT_RPC = "http://127.0.0.1:8545";

export function getAddressesForChain(chainId) {
  return addresses[String(chainId)] || null;
}

function getEthereum() {
  const { ethereum } = window;
  if (!ethereum) return null;
  if (ethereum.providers?.length) {
    return (
      ethereum.providers.find((p) => p.isMetaMask) || ethereum.providers[0]
    );
  }
  return ethereum;
}

export function getReadOnlyRegistry(chainId = 31337) {
  const entry = getAddressesForChain(chainId);
  if (!entry?.ALUAssetRegistry) {
    throw new Error(
      `No registry address for chain ${chainId}. Deploy with Hardhat first.`
    );
  }
  const provider = new JsonRpcProvider(HARDHAT_RPC);
  const registry = new Contract(entry.ALUAssetRegistry, registryAbi, provider);
  return { registry, addresses: entry, provider };
}

export async function getProviderAndSigner() {
  const ethereum = getEthereum();
  if (!ethereum) {
    throw new Error("MetaMask is not installed");
  }
  const provider = new BrowserProvider(ethereum);
  const signer = await provider.getSigner();
  return { provider, signer };
}

export async function getContracts(chainId, withSigner = false) {
  const entry = getAddressesForChain(chainId);
  if (!entry?.ALUAssetRegistry || !entry?.ALULogoToken) {
    throw new Error(
      `No contract addresses for chain ${chainId}. Start Hardhat, deploy, then refresh.`
    );
  }

  const { provider, signer } = await getProviderAndSigner();
  const runner = withSigner ? signer : provider;
  const registry = new Contract(entry.ALUAssetRegistry, registryAbi, runner);
  const token = new Contract(entry.ALULogoToken, tokenAbi, runner);

  return { registry, token, addresses: entry, provider, signer };
}

export async function readTokenOverview(chainId, account) {
  const { token, addresses } = await getContracts(chainId, false);
  const [totalSupply, balance, percentage, symbol, name] = await Promise.all([
    token.totalSupply(),
    token.balanceOf(account),
    token.ownershipPercentage(account),
    token.symbol(),
    token.name(),
  ]);

  return {
    name,
    symbol,
    totalSupply: formatUnits(totalSupply, 18),
    balance: formatUnits(balance, 18),
    percentage: Number(percentage),
    tokenAddress: addresses.ALULogoToken,
    registryAddress: addresses.ALUAssetRegistry,
    officialTokenId: addresses.officialTokenId,
  };
}
