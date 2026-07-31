# Key Carousel

A lightweight, resilient **Round-Robin Connection Manager** and **Circuit Breaker** for Node.js / Next.js. 

When dealing with third-party APIs or external services, you might encounter rate limits (HTTP 429) or unstable network connections (HTTP 503, 504). `key-carousel` acts as a middle layer that automatically rotates through available connections and temporarily isolates failing nodes.

## Features
- **Round-Robin Rotation**: Evenly distributes requests across a pool of configured connections.
- **Circuit Breaker**: Automatically flags and temporarily sidelines failing connections or tokens (e.g., when hitting rate limits).
- **Auto-Recovery**: Flagged resources are automatically reintroduced to the pool after a configurable cooldown period (default: 1 hour).
- **Fallback Mechanism**: Ensures graceful degradation if all nodes are temporarily unavailable.

## Quick Start

1. Copy `.env.example` to `.env` and fill in your connection pool.
2. Install dependencies:
   ```bash
   npm install undici
   ```
3. Import the `loadBalancer` singleton into your application.

## Usage

Check `src/example/apiRoute.ts` for a full Next.js implementation example.

```typescript
import loadBalancer from '@/lib/loadBalancer';

// Retrieves the next available connection and HTTP dispatcher
const { apiKey, proxyUrl, dispatcher } = loadBalancer.getNextConnection();

// Execute your request...
// If the request fails (e.g., 429 Too Many Requests):
loadBalancer.flagKey(apiKey);
```

## Environment Variables
- `API_KEYS`: Comma-separated list of tokens or keys.
- `PROXIES`: Comma-separated list of proxy URLs (if routing traffic).

## License
MIT
