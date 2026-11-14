# ALU Logo Registry dApp

**Repository:** https://github.com/shasha-12/alu-logo-blockchain-registryy  
**Formative 2 branch:** `assignment-2` — keep Formative 1 on `main` untouched until it is graded.

**Video:** https://www.canva.com/design/DAXa57WcroY/UPhsFX2vxeESUNJPNIlB4g/view

This is the Formative 1 ALU logo project plus a web frontend. The same Solidity contracts still register the logo and issue ALUT shares. The new React app lets someone use MetaMask in the browser instead of typing Hardhat commands.

`ALUAssetRegistry` (ERC-721) keeps one NFT and the SHA-256 of the logo file. `ALULogoToken` (ERC-20) is 1,000,000 ALUT shares. The site uses ethers.js. Reads like `verifyLogoIntegrity` and `balanceOf` are free. Writes like `registerAsset` and `distributeShares` open MetaMask so you can approve the transaction.

## Official ALU logo SHA-256

File: `alu-logo.png`

```
SHA-256:  6d13df33f91ac85ecff9ac602118084bd3f681f9750a2a83266b7845cf183bbd
bytes32:  0x6d13df33f91ac85ecff9ac602118084bd3f681f9750a2a83266b7845cf183bbd
```

Check it yourself:

```bash
shasum -a 256 alu-logo.png
# or
node scripts/hash-logo.js
```

## Versions

| Tool | Version |
|------|---------|
| Node.js | 24.22.0 |
| Hardhat | 2.29.1 |
| Solidity | 0.8.24 (EVM Cancun) |
| OpenZeppelin | 5.x |
| React | 19.3 |
| Vite | 8.3 |
| ethers.js | 6.17 |

## Setup (contracts)

```bash
cd "blockchain and applications_assignment"
npm install
npx hardhat compile
npx hardhat test
```

Expected test result: **13 passing** (8 from Formative 1 + 5 dApp integration tests).

## Run local chain and deploy

Terminal 1:

```bash
npx hardhat node
```

Terminal 2:

```bash
npx hardhat run scripts/deploy.js --network localhost
```

Deploy writes contract addresses into `frontend/src/contracts/addresses.json` for chain `31337`.

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`).

### MetaMask for local work

1. Add network **Hardhat Local**
   - RPC: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency: `ETH`
2. For owner actions, import Hardhat Account #0 (public test key only — never use with real funds):

```
0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

Address should be `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266`.

### Using each page

| Tab | Wallet needed? | What it does |
|-----|----------------|--------------|
| **Verify** | No | Upload a file or paste a hash, call `verifyLogoIntegrity` on token ID 1 |
| **Register** | Yes | Hash an image, then call `registerAsset` |
| **Dashboard** | Yes | Show supply, balances, sample holders; owner can call `distributeShares` |

Connect Wallet sits in the header on every page. After connect, the short address and ALUT balance appear when contracts are available on the current chain.

## Project layout

```
contracts/                     Formative 1 Solidity contracts
frontend/                      React + Vite dApp
  src/components/              Verify, Register, Dashboard UI
  src/contracts/               ABIs + addresses.json
  src/hooks/                   MetaMask helpers
scripts/deploy.js              Deploys both contracts and saves addresses
test/ALUAssetRegistry.test.js  13 automated tests
alu-logo.png                   Official logo used for the hash
remix/                         Remix copies (GitHub imports)
Project_Report.pdf             Written report for portal / ZIP
```

## Sepolia (Formative 1)

| Item | Value |
|------|--------|
| Registry | https://sepolia.etherscan.io/address/0xE75eFCb283302be123B837b456e7B4ecfb670E7b |
| Token | https://sepolia.etherscan.io/address/0x639DC7FC83F206527F6E52BAc84C1d22ba66D51A |

The local dApp defaults to Hardhat (`31337`). Sepolia addresses are kept in `addresses.json` for reference.

## Problems and fixes

1. **OpenZeppelin `mcopy` / Cancun** — set `evmVersion: "cancun"` in `hardhat.config.js`.
2. **Remix `https` imports inside `contracts/`** — Hardhat failed with HH406. Remix copies live under `remix/` instead.
3. **MetaMask still on Mainnet** — the UI shows chain ID and a Switch to Hardhat Local button.
4. **Official logo already registered** — `deploy.js` registers it as token ID 1, so registering the same hash again correctly reverts as a duplicate.

## Known limitations

- Verify and register against the local Hardhat node require `npx hardhat node` to be running.
- The example holders table uses the first three Hardhat accounts.
- `Project_Report.pdf` is for course submission; it does not have to live on GitHub.
