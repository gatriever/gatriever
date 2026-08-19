import type { IncomingMessage, ServerResponse } from "node:http";

export interface ExtendedRequest extends IncomingMessage {
  json: <T = unknown>() => Promise<T>;
  params?: Record<string, string>;
  query?: URLSearchParams;
}

export interface ExtendedResponse extends ServerResponse {
  json: (data: unknown, statusCode?: number) => void;
}

export type RouteHandler = (
  req: ExtendedRequest,
  res: ExtendedResponse
) => Promise<void> | void;

export class MicroRouter {
  private routes: Map<string, RouteHandler> = new Map();

  get(path: string, handler: RouteHandler): this {
    this.routes.set(`GET:${path}`, handler);
    return this;
  }

  post(path: string, handler: RouteHandler): this {
    this.routes.set(`POST:${path}`, handler);
    return this;
  }

  put(path: string, handler: RouteHandler): this {
    this.routes.set(`PUT:${path}`, handler);
    return this;
  }

  delete(path: string, handler: RouteHandler): this {
    this.routes.set(`DELETE:${path}`, handler);
    return this;
  }

  async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const key = `${req.method}:${url.pathname}`;
    const handler = this.routes.get(key);

    const extendedReq = req as ExtendedRequest;
    extendedReq.query = url.searchParams;
    extendedReq.json = async <T = unknown>(): Promise<T> => {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
      }
      const raw = Buffer.concat(chunks).toString("utf8");
      return raw ? JSON.parse(raw) : ({} as T);
    };

    const extendedRes = res as ExtendedResponse;
    extendedRes.json = (data: unknown, statusCode: number = 200) => {
      res.writeHead(statusCode, {
        "Content-Type": "application/json; charset=utf-8",
      });
      res.end(JSON.stringify(data));
    };

    if (!handler) {
      extendedRes.json({ error: "Not Found" }, 404);
      return;
    }

    try {
      await handler(extendedReq, extendedRes);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      extendedRes.json({ error: message }, 500);
    }
  }
}
