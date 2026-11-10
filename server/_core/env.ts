import { MANUS_APP_ID } from "@shared/const";

export const ENV = {
  appId: MANUS_APP_ID,
  cookieSecret:
    process.env.SESSION_SECRET?.trim() ||
    process.env.JWT_SECRET?.trim() ||
    process.env.SECRET_KEY?.trim() ||
    process.env.COOKIE_SECRET?.trim() ||
    "mazigho-universal-session-secret-key-2026-studio-v1",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl:
    process.env.OAUTH_SERVER_URL ??
    process.env.BUILT_IN_FORGE_API_URL ??
    "https://api.manus.im",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "operator-yacbhl71",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? process.env.OPENAI_API_KEY ?? "",
  geminiApiKey: process.env.GEMINI_API_KEY ?? process.env.API_KEY ?? "",
  clonerEnabled: (process.env.CLONER_ENABLED ?? "false").toLowerCase() === "true",
  clonerServiceUrl: process.env.CLONER_SERVICE_URL ?? "",
  clonerApiKey: process.env.CLONER_API_KEY ?? "",
};
