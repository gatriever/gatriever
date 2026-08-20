import type { IncomingMessage, ServerResponse } from "node:http";
import { createApiServer, type ApiServerOptions } from "../core.js";

export function createFirebaseApiHandler(options: ApiServerOptions = {}) {
  const { router } = createApiServer(options);
  return (req: IncomingMessage, res: ServerResponse) => {
    return router.handle(req, res);
  };
}

export default createFirebaseApiHandler;
