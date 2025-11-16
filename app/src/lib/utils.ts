export const calculateOdds = (
  startTime: number,
  midPrice: number,
  currentTime: number,
  currentPrice: number
): number => {
  const timeDist = startTime - currentTime;
  const priceDist = Math.abs(midPrice - currentPrice);

  const timeMultiplier = 1 + timeDist / 30;
  const priceMultiplier = 1 + priceDist / 0.5;

  const odds = timeMultiplier * priceMultiplier;
  return Math.max(1.2, Math.min(100, odds));
};

export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
};

export const formatPrice = (price: number): string => {
  return `$${price.toFixed(4)}`;
};