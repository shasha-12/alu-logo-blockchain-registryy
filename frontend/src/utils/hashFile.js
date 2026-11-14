export async function sha256FileToBytes32(file) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  const bytes = new Uint8Array(digest);
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
  return `0x${hex}`;
}

export const OFFICIAL_LOGO_HASH =
  "0x6d13df33f91ac85ecff9ac602118084bd3f681f9750a2a83266b7845cf183bbd";
