// server.ts
import { serve } from "bun";

// Simulated price data (replace with real Chainlink data if needed)
let currentPrice = 2000;
let priceDirection = 1;

// Store all connected clients
const clients = new Set<any>();

// Function to generate realistic price movements
function updatePrice() {
  // Random walk with momentum
  const volatility = 0.002; // 0.2% volatility
  const change = currentPrice * volatility * (Math.random() - 0.5) * 2;
  currentPrice += change;

  // Add some trend
  currentPrice += priceDirection * 0.5;

  // Occasionally change direction
  if (Math.random() < 0.05) {
    priceDirection *= -1;
  }

  // Keep price in reasonable range
  if (currentPrice < 1500) currentPrice = 1500;
  if (currentPrice > 2500) currentPrice = 2500;

  return currentPrice;
}

// Broadcast price updates to all clients
function broadcastPrice() {
  const price = updatePrice();
  const timestamp = Date.now(); // milliseconds

  const message = JSON.stringify({
    type: "price_update",
    source: "chainlink",
    data: {
      price: parseFloat(price.toFixed(2)),
      timestamp: timestamp,
    },
  });

  // Send to all connected clients
  clients.forEach((client) => {
    if (client.readyState === 1) {
      // 1 = OPEN
      client.send(message);
    }
  });
}

// Start broadcasting prices every second
setInterval(broadcastPrice, 1000);

const server = serve({
  port: 3001,

  fetch(req, server) {
    // Upgrade HTTP request to WebSocket
    if (server.upgrade(req)) {
      return; // WebSocket upgrade successful
    }

    // Handle regular HTTP requests
    return new Response("WebSocket server running", { status: 200 });
  },

  websocket: {
    open(ws) {
      console.log("Client connected");
      clients.add(ws);

      // Send initial price immediately
      const message = JSON.stringify({
        type: "price_update",
        source: "chainlink",
        data: {
          price: parseFloat(currentPrice.toFixed(2)),
          timestamp: Date.now(),
        },
      });
      ws.send(message);
    },

    message(ws, message) {
      console.log("Received message:", message);
      // Handle incoming messages if needed
    },

    close(ws) {
      console.log("Client disconnected");
      clients.delete(ws);
    },

    error(ws, error) {
      console.error("WebSocket error:", error);
      clients.delete(ws);
    },
  },
});

console.log(`WebSocket server running on ws://localhost:${server.port}`);
