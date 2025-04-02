# Aver AI Token Data Application

A real-time cryptocurrency data application for Ethereum and Aver AI tokens, built with Next.js, TypeScript, MongoDB Atlas, and Redis.

## Features

- Real-time token price data updated every 30 seconds
- Interactive 7-day OHLC charts
- Responsive UI built with TailwindCSS
- Optimized for 10K+ concurrent users

## Tech Stack

- **Frontend**: Next.js, TailwindCSS
- **Backend**: Next.js API routes with TypeScript
- **Database**: MongoDB Atlas
- **Caching**: Redis
- **Data Source**: CoinGecko API
- **Deployment**: Vercel

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Automated Tests

The project includes comprehensive test coverage for critical components:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate test coverage report
npm run test:coverage
```

### Test Coverage

- ✅ API endpoints (error handling and happy paths)
- ✅ MongoDB connection and data operations
- ✅ Redis caching mechanisms
- ✅ Security validations

For more details, see [**tests**/README.md](./__tests__/README.md).

## Architecture

The application follows a monolithic architecture using Next.js:

- HTTP endpoint (`/api/tokens`) for token price data and 7-day OHLC data
- MongoDB stores price data every minute
- Redis caches prices (30-second TTL) and OHLC data (5-minute TTL)
- Real-time updates delivered to the frontend using data refreshed every 30 seconds

## Deployment

This application is optimized for deployment on [Vercel](https://vercel.com).

## License

[MIT](LICENSE)
