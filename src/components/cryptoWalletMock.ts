/** Demo chain addresses — replace with API. */
export function mockDepositAddress(symbol: string): string {
  const s = symbol.toUpperCase();
  if (s === "BTC") return "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh";
  if (s === "USDT") return "TXYZopYRdj2D9XRtbG411XZZ3kM33VkJf";
  return "0x71C7656EC7ab88b098defB751B7401B5f6d8976F";
}

export function truncateAddress(addr: string, start = 4, end = 4): string {
  if (addr.length <= start + end + 3) return addr;
  return `${addr.slice(0, start)}...${addr.slice(-end)}`;
}

export function qrCodeUrl(data: string, size = 220): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
}
