import "@testing-library/jest-dom";
// This file is included by Jest before running tests
import fetchMock from "jest-fetch-mock";

// Enable fetch mocks
fetchMock.enableMocks();

// Mock environment variables
process.env.MONGODB_URI = "mongodb://localhost:27017/test";
process.env.UPSTASH_REDIS_URL = "redis://localhost:6379";
process.env.UPSTASH_REDIS_TOKEN = "mock-token";
process.env.COINGECKO_API_KEY = "mock-api-key";

// Mock Request for Next.js API routes
global.Request = class {} as any;

// Global mocks
jest.mock("@upstash/redis", () => {
  return {
    Redis: jest.fn().mockImplementation(() => ({
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      expire: jest.fn(),
    })),
  };
});

// Mock axios
jest.mock("axios", () => ({
  get: jest.fn(),
  create: jest.fn(() => ({
    get: jest.fn(),
  })),
  default: {
    create: jest.fn(() => ({
      get: jest.fn(),
    })),
    get: jest.fn(),
  },
}));

// Mock console methods to keep test output clean
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
};
