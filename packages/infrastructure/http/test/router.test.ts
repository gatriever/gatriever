import { describe, it, expect, vi } from "vitest";
import { MicroRouter } from "@infra/http";
import type { IncomingMessage, ServerResponse } from "node:http";

describe("@gatriever/http: MicroRouter", () => {
  function createMockReqRes(method: string, url: string, body?: unknown) {
    const req = {
      method,
      url,
      headers: { host: "localhost:3000" },
      [Symbol.asyncIterator]: async function* () {
        if (body !== undefined) {
          yield Buffer.from(JSON.stringify(body));
        }
      },
    } as unknown as IncomingMessage;

    let responseStatusCode = 200;
    let responseHeaders: Record<string, string> = {};
    let responseData = "";

    const res = {
      writeHead: vi.fn((status: number, headers?: Record<string, string>) => {
        responseStatusCode = status;
        if (headers) responseHeaders = headers;
        return res;
      }),
      end: vi.fn((data?: string) => {
        if (data) responseData = data;
        return res;
      }),
      getStatus: () => responseStatusCode,
      getData: () => (responseData ? JSON.parse(responseData) : null),
      getHeaders: () => responseHeaders,
    } as unknown as ServerResponse & {
      getStatus: () => number;
      getData: () => unknown;
      getHeaders: () => Record<string, string>;
    };

    return { req, res };
  }

  it("should match GET route and respond with JSON", async () => {
    const router = new MicroRouter();
    router.get("/health", (_req, res) => {
      res.json({ status: "ok" });
    });

    const { req, res } = createMockReqRes("GET", "/health");
    await router.handle(req, res);

    expect(res.getStatus()).toBe(200);
    expect(res.getData()).toEqual({ status: "ok" });
  });

  it("should match POST route with request body", async () => {
    const router = new MicroRouter();
    router.post("/api/v1/sync", async (req, res) => {
      const body = await req.json<{ propertyId: string }>();
      res.json({ success: true, propertyId: body.propertyId }, 201);
    });

    const { req, res } = createMockReqRes("POST", "/api/v1/sync", { propertyId: "12345" });
    await router.handle(req, res);

    expect(res.getStatus()).toBe(201);
    expect(res.getData()).toEqual({ success: true, propertyId: "12345" });
  });

  it("should return 404 for unmatched routes", async () => {
    const router = new MicroRouter();
    const { req, res } = createMockReqRes("GET", "/non-existent");
    await router.handle(req, res);

    expect(res.getStatus()).toBe(404);
    expect(res.getData()).toEqual({ error: "Not Found" });
  });
});
