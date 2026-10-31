const hre = require("hardhat");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

function hashLogoFile() {
  const logoPath = path.join(__dirname, "..", "alu-logo.png");
  if (!fs.existsSync(logoPath)) {
    throw new Error(`ALU logo file not found at ${logoPath}`);
  }
  const digest = crypto.createHash("sha256").update(fs.readFileSync(logoPath)).digest("hex");
  return { logoPath, contentHash: "0x" + digest };
}

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  const { logoPath, contentHash } = hashLogoFile();

  console.log("============================================================");
  console.log("ALU Logo Protection — deployment");
  console.log("============================================================");
  console.log("Deployer / logo owner:", deployer.address);
  console.log("Logo file:            ", logoPath);
  console.log("SHA-256 content hash: ", contentHash);
  console.log("");

  const Registry = await hre.ethers.getContractFactory("ALUAssetRegistry");
  const registry = await Registry.deploy();
  await registry.waitForDeployment();
  console.log("ALUAssetRegistry deployed to:", await registry.getAddress());

  const tx = await registry.registerAsset(
    "ALU Official Logo",
    "image/png",
    contentHash
  );
  const receipt = await tx.wait();

  const registeredEvent = receipt.logs
    .map((log) => {
      try {
        return registry.interface.parseLog(log);
      } catch {
        return null;
      }
    })
    .find((parsed) => parsed && parsed.name === "AssetRegistered");

  const tokenId = registeredEvent ? registeredEvent.args.tokenId : 1n;
  console.log("ALU logo registered as token ID:", tokenId.toString());
  console.log("Registration tx hash:          ", receipt.hash);

  const Token = await hre.ethers.getContractFactory("ALULogoToken");
  const token = await Token.deploy(deployer.address);
  await token.waitForDeployment();
  const ownerBalance = await token.balanceOf(deployer.address);
  console.log("ALULogoToken deployed to:      ", await token.getAddress());
  console.log(
    "ALUT minted to logo owner:     ",
    hre.ethers.formatUnits(ownerBalance, 18),
    "ALUT"
  );
  console.log("============================================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
