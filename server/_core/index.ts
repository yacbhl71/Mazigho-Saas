import "dotenv/config";
import express, { type Express } from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic } from "./static";
import { stripeLiveWebhookHandler, stripeWebhookHandler } from "../stripeWebhook";
import { lemonSqueezyWebhookHandler } from "../lemonSqueezyWebhook";
import { securityHeaders } from "./securityHeaders";
import path from "path";
import { JSON_BODY_LIMIT, payloadTooLargeHandler, URL_ENCODED_BODY_LIMIT } from "./requestLimits";
import { configuredOwnerAccessRepair } from "../ownerAccessRepair";
import { registerCloneImportRoute } from "../services/import-router";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

export async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

const app = express();
export { app };

export function configureApi(targetApp: Express = app) {
  targetApp.disable("x-powered-by");
  targetApp.use(securityHeaders);
  targetApp.use(configuredOwnerAccessRepair);
  targetApp.use("/generated", express.static(path.join(process.cwd(), "public/generated")));
  // Stripe requires the raw request body for signature verification.
  targetApp.post("/api/stripe/webhook", express.raw({ type: "application/json" }), stripeWebhookHandler);
  // Production uses a dedicated endpoint and webhook secret. It is inactive
  // until the explicit live Stripe configuration is present server-side.
  targetApp.post("/api/stripe/live-webhook", express.raw({ type: "application/json" }), stripeLiveWebhookHandler);
  // Lemon Squeezy signs raw webhook bodies. This endpoint is limited to
  // MAZIGHO SaaS Test billing and is isolated from storefront checkout.
  targetApp.post("/api/lemon-squeezy/webhook", express.raw({ type: "application/json" }), lemonSqueezyWebhookHandler);
  // Base64 uploads have dedicated schema limits; this parser limit keeps room
  // for the largest allowed accounting document without accepting 50 MiB.
  targetApp.use(express.json({ limit: JSON_BODY_LIMIT }));
  targetApp.use(express.urlencoded({ limit: URL_ENCODED_BODY_LIMIT, extended: true }));
  registerCloneImportRoute(targetApp);
  // OAuth callback under /api/oauth/callback.
  registerOAuthRoutes(targetApp);
  // tRPC API.
  targetApp.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  targetApp.use(payloadTooLargeHandler);
}

export async function startProductionServer() {
  const server = createServer(app);
  configureApi(app);
  serveStatic(app);

  const port = parseInt(process.env.PORT || "8080", 10);

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${port}/`);
  });
}

export async function startDevServer() {
  const server = createServer(app);
  configureApi(app);
  const { setupVite } = await import("./vite");
  await setupVite(app, server);

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, "0.0.0.0", () => {
    console.log(`Dev server running on http://0.0.0.0:${port}/`);
  });
}

if (!process.env.VERCEL && !process.env.VITEST) {
  if (process.env.NODE_ENV === "development") {
    startDevServer().catch(console.error);
  } else {
    startProductionServer().catch(console.error);
  }
}
