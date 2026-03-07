const exactFormatter = new Intl.NumberFormat("en-US");

export function formatUnits(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000) {
    return `${(n / 1000).toFixed(1)}k`;
  }
  return Math.floor(n).toString();
}

export function formatExactUnits(n: number): string {
  return exactFormatter.format(Math.floor(n));
}
