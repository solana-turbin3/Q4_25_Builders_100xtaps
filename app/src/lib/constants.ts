export const GRID_TIME_SIZE = 5;
export const GRID_PRICE_SIZE = 5;
export const BET_AMOUNT = 10;
export const VERTICAL_GRIDS = 15;
export const HORIZONTAL_GRIDS = 20;
export const INITIAL_BALANCE = 1000.0;
export const INITIAL_PRICE = 100.5;

export const WEBSOCKET_URL = 'wss://thepriceisright.xyz/';
// export const WEBSOCKET_URL = 'ws://localhost:3001';


export const SOLANA_NETWORK = 'devnet'; // or 'mainnet-beta'

export const SESSION_DURATIONS = {
  '30m': 30 * 60 * 1000,  // 30 minutes in milliseconds
  '1h': 60 * 60 * 1000,   // 1 hour
  '2h': 2 * 60 * 60 * 1000, // 2 hours
  '4h': 4 * 60 * 60 * 1000, // 4 hours
} as const;

export const MARKETPDA = "8g3iHpWjrWUSVADc8U6YR1CvPxZrTyQeUDLR2cyyisCe";