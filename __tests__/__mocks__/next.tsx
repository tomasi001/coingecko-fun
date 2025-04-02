// Mock for NextResponse
class MockResponse {
  private _status: number = 200;
  private _body: any = null;

  setStatus(code: number) {
    this._status = code;
    return this;
  }

  get status() {
    return this._status;
  }

  setJson(data: any) {
    this._body = data;
    return this;
  }

  async json() {
    return this._body;
  }
}

// Export mocked NextResponse
export const NextResponse = {
  json: (body: any, init?: ResponseInit) => {
    const response = new MockResponse();
    if (init?.status) {
      response.setStatus(init.status);
    }
    return response.setJson(body);
  },
};

// Mock for NextRequest
export class NextRequest extends Request {
  constructor(input: RequestInfo, init?: RequestInit) {
    super(input || "http://localhost", init);
  }
}

// Mock for Next.js useRouter hook
export const useRouter = jest.fn().mockReturnValue({
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  reload: jest.fn(),
  pathname: "/",
  query: {},
  asPath: "/",
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
});
