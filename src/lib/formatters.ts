export const currency = (n: number, opts: Intl.NumberFormatOptions = {}) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    ...opts,
  }).format(n);

export const compactCurrency = (n: number) => {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1_000_000_000) return `${sign}$${(abs / 1_000_000_000).toFixed(2)}B`;
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(2)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(0)}`;
};

export const number = (n: number) => new Intl.NumberFormat("en-US").format(n);

export const percent = (n: number, digits = 1) =>
  `${n >= 0 ? "" : ""}${n.toFixed(digits)}%`;

export const signedPercent = (n: number, digits = 1) =>
  `${n > 0 ? "+" : ""}${n.toFixed(digits)}%`;