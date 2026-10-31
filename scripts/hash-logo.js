const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const logoPath = path.join(__dirname, "..", "alu-logo.png");

if (!fs.existsSync(logoPath)) {
  console.error("Could not find alu-logo.png at", logoPath);
  process.exit(1);
}

const fileBytes = fs.readFileSync(logoPath);
const hexHash = crypto.createHash("sha256").update(fileBytes).digest("hex");

console.log("File:            ", logoPath);
console.log("Size (bytes):    ", fileBytes.length);
console.log("SHA-256 (hex):   ", hexHash);
console.log("bytes32 value:   ", "0x" + hexHash);
