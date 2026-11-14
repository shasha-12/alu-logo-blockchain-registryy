function formatAlutAmount(wei) {
  const { ethers } = require("hardhat");
  return ethers.formatUnits(wei, 18);
}

function verificationView(isAuthentic, message) {
  if (isAuthentic) {
    return {
      status: "success",
      headline: "Logo Verified",
      detail: "This is the authentic ALU logo registered on the blockchain.",
      message,
    };
  }
  return {
    status: "failure",
    headline: "Warning: This logo has been modified",
    detail:
      "The file does not match the official logo stored on-chain. Do not trust it as the authentic ALU mark.",
    message,
  };
}

function sha256FileToBytes32(filePath) {
  const crypto = require("crypto");
  const fs = require("fs");
  const digest = crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
  return "0x" + digest;
}

module.exports = {
  formatAlutAmount,
  verificationView,
  sha256FileToBytes32,
};
