export const GRID_TIME_SIZE = 5;
export const GRID_PRICE_SIZE = 5;
export const BET_AMOUNT = 10;
export const VERTICAL_GRIDS = 15;
export const HORIZONTAL_GRIDS = 20;
export const INITIAL_BALANCE = 1000.0;
export const INITIAL_PRICE = 100.5;

export const WEBSOCKET_URL = 'wss://thepriceisright.xyz/';
// export const WEBSOCKET_URL = 'ws://localhost:3001';

export const SESSION_DURATIONS = {
  '1h': 3600,
  '2h': 7200,
  '4h': 14400,
  '24h': 86400,
} as const;

export const SOLANA_NETWORK = 'devnet'; // or 'mainnet-beta'