const { expect } = require("chai");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const LOGO_PATH = path.join(__dirname, "..", "alu-logo.png");
const LOGO_NAME = "ALU Official Logo";
const LOGO_TYPE = "image/png";
const TOTAL_SUPPLY = ethers.parseUnits("1000000", 18);

function sha256File(filePath) {
  const digest = crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
  return "0x" + digest;
}

function randomHash() {
  return ethers.hexlify(ethers.randomBytes(32));
}

describe("ALUAssetRegistry", function () {
  let registry;
  let owner;
  let other;
  let logoHash;

  beforeEach(async function () {
    [owner, other] = await ethers.getSigners();
    logoHash = sha256File(LOGO_PATH);

    const Registry = await ethers.getContractFactory("ALUAssetRegistry");
    registry = await Registry.deploy();
    await registry.waitForDeployment();
  });

  it("registers the ALU logo successfully and returns a token ID", async function () {
    const returnedId = await registry.registerAsset.staticCall(
      LOGO_NAME,
      LOGO_TYPE,
      logoHash
    );
    expect(returnedId).to.equal(1n);

    const tx = await registry.registerAsset(LOGO_NAME, LOGO_TYPE, logoHash);
    await expect(tx)
      .to.emit(registry, "AssetRegistered")
      .withArgs(1, LOGO_NAME, logoHash, owner.address, anyValue);

    expect(await registry.ownerOf(1)).to.equal(owner.address);
    expect(await registry.registeredHashes(logoHash)).to.equal(true);
  });

  it("rejects a second registration of the same content hash", async function () {
    await registry.registerAsset(LOGO_NAME, LOGO_TYPE, logoHash);

    await expect(
      registry.connect(other).registerAsset("Fake ALU Logo", LOGO_TYPE, logoHash)
    ).to.be.revertedWith("Asset already registered: duplicate content hash");
  });

  it("verifyLogoIntegrity() returns true when the correct hash is supplied", async function () {
    await registry.registerAsset(LOGO_NAME, LOGO_TYPE, logoHash);

    const result = await registry.verifyLogoIntegrity(1, logoHash);
    expect(result.isAuthentic).to.equal(true);
    expect(result.message).to.equal("Logo is authentic.");
  });

  it("verifyLogoIntegrity() returns false when an incorrect hash is supplied", async function () {
    await registry.registerAsset(LOGO_NAME, LOGO_TYPE, logoHash);

    const result = await registry.verifyLogoIntegrity(1, randomHash());
    expect(result.isAuthentic).to.equal(false);
    expect(result.message).to.equal("Warning: logo does not match.");
  });

  it("getAsset() returns the correct asset name and file type for a registered token", async function () {
    await registry.registerAsset(LOGO_NAME, LOGO_TYPE, logoHash);

    const asset = await registry.getAsset(1);
    expect(asset.name).to.equal(LOGO_NAME);
    expect(asset.fileType).to.equal(LOGO_TYPE);
    expect(asset.contentHash).to.equal(logoHash);
    expect(asset.registrant).to.equal(owner.address);
    expect(asset.timestamp).to.be.greaterThan(0n);
  });
});

describe("ALULogoToken", function () {
  let token;
  let owner;
  let faculty;
  let student;

  beforeEach(async function () {
    [owner, faculty, student] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("ALULogoToken");
    token = await Token.deploy(owner.address);
    await token.waitForDeployment();
  });

  it("mints the full supply of 1,000,000 ALUT tokens to the logo owner on deployment", async function () {
    expect(await token.name()).to.equal("ALU Logo Token");
    expect(await token.symbol()).to.equal("ALUT");
    expect(await token.totalSupply()).to.equal(TOTAL_SUPPLY);
    expect(await token.balanceOf(owner.address)).to.equal(TOTAL_SUPPLY);
    expect(await token.owner()).to.equal(owner.address);
  });

  it("distributeShares() correctly transfers the specified number of tokens to a recipient", async function () {
    const amount = ethers.parseUnits("100000", 18);

    await expect(token.distributeShares(faculty.address, amount))
      .to.emit(token, "Transfer")
      .withArgs(owner.address, faculty.address, amount);

    expect(await token.balanceOf(faculty.address)).to.equal(amount);
    expect(await token.balanceOf(owner.address)).to.equal(TOTAL_SUPPLY - amount);

    await expect(
      token.connect(faculty).distributeShares(student.address, amount)
    ).to.be.revertedWithCustomError(token, "OwnableUnauthorizedAccount");

    await expect(
      token.distributeShares(student.address, 0)
    ).to.be.revertedWith("Amount must be greater than zero");
  });

  it("ownershipPercentage() returns the correct percentage for a known token balance", async function () {
    const half = ethers.parseUnits("500000", 18);
    const tenth = ethers.parseUnits("100000", 18);

    await token.distributeShares(faculty.address, half);
    await token.distributeShares(student.address, tenth);

    expect(await token.ownershipPercentage(faculty.address)).to.equal(50n);
    expect(await token.ownershipPercentage(student.address)).to.equal(10n);
    expect(await token.ownershipPercentage(owner.address)).to.equal(40n);
  });
});

describe("Frontend dApp integration", function () {
  const {
    formatAlutAmount,
    verificationView,
    sha256FileToBytes32,
  } = require("./helpers/dappViews");

  const OFFICIAL_HASH =
    "0x6d13df33f91ac85ecff9ac602118084bd3f681f9750a2a83266b7845cf183bbd";

  let registry;
  let token;
  let owner;
  let faculty;

  beforeEach(async function () {
    [owner, faculty] = await ethers.getSigners();

    const Registry = await ethers.getContractFactory("ALUAssetRegistry");
    registry = await Registry.deploy();
    await registry.waitForDeployment();
    await registry.registerAsset(LOGO_NAME, LOGO_TYPE, sha256File(LOGO_PATH));

    const Token = await ethers.getContractFactory("ALULogoToken");
    token = await Token.deploy(owner.address);
    await token.waitForDeployment();
  });

  it("frontend reads total ALUT supply from the contract as 1,000,000", async function () {
    const supplyWei = await token.totalSupply();
    const displayed = formatAlutAmount(supplyWei);

    expect(supplyWei).to.equal(TOTAL_SUPPLY);
    expect(displayed).to.equal("1000000.0");
    expect(Number(displayed)).to.equal(1000000);
  });

  it("hashing a file returns the correct SHA-256 hash in bytes32 format", async function () {
    const hash = sha256FileToBytes32(LOGO_PATH);

    expect(hash.startsWith("0x")).to.equal(true);
    expect(hash.length).to.equal(66);
    expect(hash).to.equal(OFFICIAL_HASH);
    expect(hash).to.equal(sha256File(LOGO_PATH));
  });

  it("verifyLogoIntegrity with the correct hash produces a verification success result", async function () {
    const result = await registry.verifyLogoIntegrity(1, OFFICIAL_HASH);
    const view = verificationView(result.isAuthentic, result.message);

    expect(result.isAuthentic).to.equal(true);
    expect(view.status).to.equal("success");
    expect(view.headline).to.equal("Logo Verified");
  });

  it("verifyLogoIntegrity with an incorrect hash produces a verification failure result", async function () {
    const result = await registry.verifyLogoIntegrity(1, randomHash());
    const view = verificationView(result.isAuthentic, result.message);

    expect(result.isAuthentic).to.equal(false);
    expect(view.status).to.equal("failure");
    expect(view.headline).to.equal("Warning: This logo has been modified");
  });

  it("distributeShares updates the recipient balance after a successful transfer", async function () {
    const amount = ethers.parseUnits("100000", 18);

    expect(await token.balanceOf(faculty.address)).to.equal(0n);

    await token.distributeShares(faculty.address, amount);

    const recipientBalance = await token.balanceOf(faculty.address);
    const displayed = formatAlutAmount(recipientBalance);

    expect(recipientBalance).to.equal(amount);
    expect(displayed).to.equal("100000.0");
    expect(await token.ownershipPercentage(faculty.address)).to.equal(10n);
    expect(await token.ownershipPercentage(owner.address)).to.equal(90n);
  });
});
