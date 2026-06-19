/** Display the catalog price as USD (the demo's display currency). */
export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

/** Display a crypto amount as `12.5 USDT`. */
export function formatCrypto(amount: number | string, coin: string): string {
  return `${amount} ${coin}`;
}
