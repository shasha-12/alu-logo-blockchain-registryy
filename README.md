# ALU Logo Protection on Ethereum

**Repository:** https://github.com/shasha-12/alu-logo-blockchain-registryy

**Video walkthrough:** https://canva.link/c6jd0yii0dytzsh


This project registers the official African Leadership University (ALU) logo on Ethereum and then tokenises ownership of that logo into tradable shares. Development and the eight automated tests run on a local Hardhat chain. The same contracts were also compiled in Remix IDE and deployed to the **Sepolia** testnet through MetaMask.

`ALUAssetRegistry` is an ERC-721 (NFT) contract. It mints a unique token for the logo and permanently stores a SHA-256 fingerprint of the image file. Anyone can later hash a logo file they have and call `verifyLogoIntegrity()` to see whether it is the authentic original or a modified copy.

`ALULogoToken` is an ERC-20 contract. After the logo exists as an NFT, this contract issues 1,000,000 interchangeable ALUT tokens that represent ownership shares of the logo. The original owner receives the full supply at deployment and can later call `distributeShares()` to send portions to faculty, students, or administration.

The two contracts are related but separate: the NFT proves *which file* is the official logo and *who registered it*; the ERC-20 tokens represent *how ownership of that asset is split*.

## Official ALU logo SHA-256

The registered file is `alu-logo.png` — the official navy, red, and white ALU logo.

```
SHA-256:  6d13df33f91ac85ecff9ac602118084bd3f681f9750a2a83266b7845cf183bbd
bytes32:  0x6d13df33f91ac85ecff9ac602118084bd3f681f9750a2a83266b7845cf183bbd
```

Anyone can independently verify this by running:

```bash
shasum -a 256 alu-logo.png
# or
node scripts/hash-logo.js
```

If even one pixel of the image is changed, the hash will be completely different and `verifyLogoIntegrity()` will return `"Warning: logo does not match."`

## Sepolia deployment (Remix + MetaMask)

These contracts are live on the Ethereum Sepolia testnet. Sepolia ETH is test ETH; no mainnet ETH was spent.

| Item | Value |
|------|--------|
| Deployer / logo owner | [`0xF884298b539f639FAb355DF8722AF8428cb3CD14`](https://sepolia.etherscan.io/address/0xF884298b539f639FAb355DF8722AF8428cb3CD14) |
| `ALUAssetRegistry` (ERC-721 ALUL) | [`0xE75eFCb283302be123B837b456e7B4ecfb670E7b`](https://sepolia.etherscan.io/address/0xE75eFCb283302be123B837b456e7B4ecfb670E7b) |
| `registerAsset` transaction | [`0x7c1c35ca7720631be4faab120654c2bc715641c14a446f1193593b475400c5fa`](https://sepolia.etherscan.io/tx/0x7c1c35ca7720631be4faab120654c2bc715641c14a446f1193593b475400c5fa) |
| `ALULogoToken` (ERC-20 ALUT) | [`0x639DC7FC83F206527F6E52BAc84C1d22ba66D51A`](https://sepolia.etherscan.io/address/0x639DC7FC83F206527F6E52BAc84C1d22ba66D51A) |
| Token deploy transaction | [`0x40165ba0fed829bd1799f8919c9bb5a419f83fd8f9b7d5fed2e0684fc8f27281`](https://sepolia.etherscan.io/tx/0x40165ba0fed829bd1799f8919c9bb5a419f83fd8f9b7d5fed2e0684fc8f27281) |

On Sepolia, `verifyLogoIntegrity(1)` returns `true` / `Logo is authentic.` and `ownershipPercentage` of the deployer returns `100`. Remix files with GitHub OpenZeppelin imports are in `contracts/remix/`.

## Versions

| Tool | Version |
|------|---------|
| Node.js | 24.22.0 |
| npm | 11.19.1 |
| Hardhat | 2.29.1 |
| Solidity | 0.8.24 (EVM: Cancun) |
| OpenZeppelin Contracts | 5.6.1 |
| Ethers.js | 6.17.0 |

## How to run

### 1. Install dependencies

You need [Node.js](https://nodejs.org/) 18 or later.

```bash
cd "blockchain and applications_assignment"
npm install
```

### 2. Compile the contracts

```bash
npx hardhat compile
```

### 3. Run the automated tests

Eight tests cover registration, duplicate rejection, integrity checks, metadata lookup, token supply, share distribution, and ownership percentage:

```bash
npx hardhat test
```

Expected result: `8 passing`.

### 4. Start a local blockchain and deploy

In one terminal:

```bash
npx hardhat node
```

Hardhat prints 20 test wallet addresses, each funded with 10,000 fake ETH. Leave this process running.

In a second terminal:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

The deploy script:

1. Deploys `ALUAssetRegistry`
2. Hashes `alu-logo.png` and calls `registerAsset()` so the official logo is token ID 1
3. Deploys `ALULogoToken`, minting 1,000,000 ALUT to the deployer

You can also deploy against Hardhat's in-memory network (no separate node) with:

```bash
npx hardhat run scripts/deploy.js
```

### 5. Generate the logo hash on its own

```bash
npm run hash
```

## Project layout

```
contracts/ALUAssetRegistry.sol         ERC-721 logo registry (Hardhat)
contracts/ALULogoToken.sol             ERC-20 ownership shares (Hardhat)
contracts/remix/                       Same contracts with Remix GitHub imports
scripts/deploy.js                      Deploys both contracts and registers the logo
scripts/hash-logo.js                   Prints the SHA-256 of alu-logo.png
test/ALUAssetRegistry.test.js          Eight automated tests
alu-logo.png                           Official ALU logo used for the hash
hardhat.config.js                      Solidity 0.8.24 / Hardhat configuration
Project_Report.pdf                     Written report for Questions 1 and 2
```

## Problems encountered and how they were resolved

1. **OpenZeppelin 5.6.1 uses the Cancun `mcopy` opcode.** Compiling with Hardhat's default EVM target failed with `DeclarationError: Function "mcopy" not found`. Setting `evmVersion: "cancun"` in `hardhat.config.js` resolved it.

2. **The first logo file was the wrong ALU wordmark** (a black-and-white version). It was replaced with the official navy/red/white ALU logo. Tests and the deploy script hash `alu-logo.png` from disk, so they picked up the new fingerprint automatically. The README and report hash values were then updated to match.

3. **`npm install` hit a one-off `ECONNRESET`.** Retrying the install completed normally.

4. **The Mac disk filled up (`ENOSPC`).** `npx hardhat node` could not start until caches were cleared. After freeing space, the node started normally.

5. **Port 8545 was already in use (`EADDRINUSE`).** An earlier Hardhat node was still running. Stopping that process freed the port so a new node could print the test wallets.

## Next assignment

These contracts are written to be reused by a dApp. The registry exposes `registerAsset`, `verifyLogoIntegrity`, and `getAsset`. The token exposes `distributeShares` and `ownershipPercentage`. Events (`AssetRegistered`, `Transfer`) can be indexed from a frontend.
