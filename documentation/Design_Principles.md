# Step 2: Design Principles

## Overview

This document outlines the design principles for the cryptocurrency token data display project, ensuring alignment with the client requirements and augmented details from Step 1. It covers architecture patterns, code organization, error handling, logging, security, authentication, testing, and scalability, providing a robust foundation for development.

## Background and Context

The project aims to set up an API and database infrastructure to display real-time token data for Ethereum and Aver AI, including frontend and backend development, integration with the CoinGecko API, and implementing caching and testing mechanisms. Key requirements include using Next.js and TailwindCSS for the frontend, TypeScript for the backend, MongoDB Atlas for persistent storage, and Redis for caching, with automated tests for various components. The system must handle 10K+ concurrent users, refresh data every 30 seconds, and display 7-day OHLC charts.

Augmented details include a focus on Ethereum and Aver AI tokens, a standalone product, an admin interface, interactive charts, and a critical 30-second refresh rate. The user preferred WebSocket but recommended Vercel deployment for the MVP, leading to the adoption of Server-Sent Events (SSE) due to Vercel’s WebSocket limitations.

## Architecture Pattern

- **Pattern:** Monolithic architecture using Next.js for both frontend and backend, deployed on Vercel.
- **Rationale:** Simplifies development for the MVP, leverages Vercel’s serverless functions and edge network for performance, and aligns with the user’s deployment recommendation.
- **Real-Time Mechanism:** Server-Sent Events (SSE) instead of WebSocket due to Vercel’s serverless function constraints (no persistent connections). SSE supports the 30-second refresh rate and scales well for 10K+ users on Vercel.
- **Components:**
  - **Frontend:** Next.js with TailwindCSS, hosted on Vercel.
  - **Backend:** Next.js API routes, providing SSE for real-time updates and HTTP endpoints for OHLC data.

## Code Organization and Structure

- **Frontend:**
  - **Pages:** Use `/pages` directory for routing (e.g., `/index.js` for the main token data page).
  - **Components:** Create reusable components (e.g., `<OHLCChart>`) in `/components`, styled with TailwindCSS.
  - **State Management:** Use React hooks or context for handling SSE data and chart interactivity.
- **Backend:**
  - **API Routes:** Implement in `/pages/api`:
    - `/api/sse`: SSE endpoint for real-time price updates every 30 seconds.
    - `/api/ohlc`: HTTP endpoint for 7-day OHLC data.
  - **Utilities/Services:** Create shared modules in `/lib` or `/services` for:
    - CoinGecko API interactions.
    - MongoDB Atlas connections.
    - Redis caching logic.
  - **TypeScript:** Use throughout for type safety (e.g., define types for token data, OHLC responses).
- **Structure Benefits:** Ensures modularity, maintainability, and scalability within Next.js conventions.

## Error Handling Strategy

- **Implementation:** Use try-catch blocks in API routes to catch exceptions.
- **Logging:** Console.log for development; Vercel’s logging for production.
- **Responses:** Return HTTP status codes (e.g., 500, 400) with descriptive messages.
- **Fallbacks:** Handle CoinGecko API failures by serving cached data if available.
- **Goal:** Ensure robust error management for reliability under high load.

## Logging Strategy

- **Development:** Use console.log for immediate feedback.
- **Production:** Integrate with Vercel’s logging for errors, API usage, and performance metrics.
- **Admin Interface:** Expose logs via API endpoints (e.g., `/api/admin/logs`) for error rates, API calls, and cache performance.
- **Future Consideration:** Third-party logging (e.g., Sentry) if advanced features are needed post-MVP.

## Security Principles

- **Input Validation:** Sanitize inputs to prevent injection attacks (e.g., SQL injection, malformed requests).
- **HTTPS:** Enforce via Vercel’s SSL support.
- **CORS:** Configure in API routes to allow only the frontend domain.
- **Authentication:** Public data open; admin interface secured with NextAuth (JWT or session-based).

## Authentication Mechanisms

- **Public Access:** No authentication for token data and OHLC charts.
- **Admin Access:** Authentication via NextAuth for the admin interface, ensuring only authorized access to monitoring data.

## Testing Strategies

- **Unit Tests:** Test utilities/services (e.g., CoinGecko API calls) with Jest.
- **Integration Tests:** Test API routes (SSE and OHLC endpoints) for data flow and errors.
- **Security Tests:** Validate malicious input detection (e.g., injection attempts).
- **Tools:** Jest for unit/integration tests; optional Cypress for E2E testing.

## Scalability Considerations

- **Serverless:** Vercel’s serverless functions auto-scale with demand.
- **Caching:** Redis for real-time prices (30-second updates) and OHLC data (5-minute TTL).
- **Database:** MongoDB Atlas with indexing for fast read/write operations.
- **Rate Limiting:** Apply to API routes to prevent abuse.

## Real-Time Data Handling

- **SSE:** Push price updates every 30 seconds via `/api/sse`, sourced from Redis.
- **OHLC:** Fetch via HTTP from `/api/ohlc`, cached in Redis for efficiency.
- **Interactivity:** Chart supports zoom and token toggling, per user requirement.

## Database and Caching Details

- **MongoDB Atlas:** Store `{ token: string, price: number, timestamp: Date }` every 1 minute, overwriting prior records.
- **Redis:** Cache prices (e.g., `ethereum:price`) with 30-second TTL; OHLC data with 5-minute TTL.

## Design Decisions and Trade-offs

- **SSE vs. WebSocket:** Chose SSE for Vercel compatibility; WebSocket may be revisited if moving off Vercel.
- **Monolithic:** Simplifies MVP; microservices possible for future scaling.

## Conclusion

These principles ensure a scalable, secure, and maintainable MVP, aligning with client requirements and deployment preferences.

| **Aspect**        | **Details**                                |
| ----------------- | ------------------------------------------ |
| Architecture      | Monolithic, Next.js on Vercel              |
| Real-time Updates | SSE for 30-second refreshes, HTTP for OHLC |
| Code Organization | Next.js pages and API routes, TypeScript   |
| Error Handling    | Try-catch, Vercel logging                  |
| Security          | Validation, HTTPS, admin auth              |
| Testing           | Jest for unit/integration/security         |
| Scalability       | Serverless, Redis caching, optimized DB    |

**Key Citations:**

- [Vercel Serverless Functions](https://vercel.com/docs/concepts/functions/serverless-functions)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [SSE in Next.js](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events)
- [Redis Caching](https://redis.io/topics/caching)
- [MongoDB Atlas](https://www.mongodb.com/docs/atlas/best-practices/)
