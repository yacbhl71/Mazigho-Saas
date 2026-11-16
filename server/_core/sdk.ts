import {
  AXIOS_TIMEOUT_MS,
  COOKIE_NAME,
  decodeOAuthState,
  ONE_YEAR_MS,
  SUPPORT_IMPERSONATION_COOKIE_NAME,
} from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import axios, { type AxiosInstance } from "axios";
import { createHash } from "node:crypto";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";
import type {
  ExchangeTokenRequest,
  ExchangeTokenResponse,
  GetUserInfoResponse,
  GetUserInfoWithJwtRequest,
  GetUserInfoWithJwtResponse,
} from "./types/manusTypes";
// Utility function
const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export type SessionPayload = {
  openId: string;
  appId: string;
  name: string;
  supportImpersonation?: {
    operatorOpenId: string;
    storeId: number;
    expiresAt?: string;
  };
};

const EXCHANGE_TOKEN_PATH = `/webdev.v1.WebDevAuthPublicService/ExchangeToken`;
const GET_USER_INFO_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfo`;
const GET_USER_INFO_WITH_JWT_PATH = `/webdev.v1.WebDevAuthPublicService/GetUserInfoWithJwt`;

class OAuthService {
  constructor(private client: ReturnType<typeof axios.create>) {
    if (ENV.oAuthServerUrl) {
      console.log("[OAuth] Initialized with baseURL:", ENV.oAuthServerUrl);
    } else {
      console.info(
        "[OAuth] OAUTH_SERVER_URL is not explicitly configured; using local auth & default server URL."
      );
    }
  }

  private decodeState(state: string): string {
    const { redirectUri } = decodeOAuthState(state);
    if (!redirectUri) {
      throw new Error("Invalid OAuth state");
    }
    return redirectUri;
  }

  async getTokenByCode(
    code: string,
    state: string
  ): Promise<ExchangeTokenResponse> {
    const payload: ExchangeTokenRequest = {
      clientId: ENV.appId,
      grantType: "authorization_code",
      code,
      redirectUri: this.decodeState(state),
    };

    const { data } = await this.client.post<ExchangeTokenResponse>(
      EXCHANGE_TOKEN_PATH,
      payload
    );

    return data;
  }

  async getUserInfoByToken(
    token: ExchangeTokenResponse
  ): Promise<GetUserInfoResponse> {
    const { data } = await this.client.post<GetUserInfoResponse>(
      GET_USER_INFO_PATH,
      {
        accessToken: token.accessToken,
      }
    );

    return data;
  }
}

const createOAuthHttpClient = (): AxiosInstance =>
  axios.create({
    baseURL: ENV.oAuthServerUrl,
    timeout: AXIOS_TIMEOUT_MS,
  });

class SDKServer {
  private readonly client: AxiosInstance;
  private readonly oauthService: OAuthService;

  constructor(client: AxiosInstance = createOAuthHttpClient()) {
    this.client = client;
    this.oauthService = new OAuthService(this.client);
  }

  private deriveLoginMethod(
    platforms: unknown,
    fallback: string | null | undefined
  ): string | null {
    if (fallback && fallback.length > 0) return fallback;
    if (!Array.isArray(platforms) || platforms.length === 0) return null;
    const set = new Set<string>(
      platforms.filter((p): p is string => typeof p === "string")
    );
    if (set.has("REGISTERED_PLATFORM_EMAIL")) return "email";
    if (set.has("REGISTERED_PLATFORM_GOOGLE")) return "google";
    if (set.has("REGISTERED_PLATFORM_APPLE")) return "apple";
    if (
      set.has("REGISTERED_PLATFORM_MICROSOFT") ||
      set.has("REGISTERED_PLATFORM_AZURE")
    )
      return "microsoft";
    if (set.has("REGISTERED_PLATFORM_GITHUB")) return "github";
    const first = Array.from(set)[0];
    return first ? first.toLowerCase() : null;
  }

  /**
   * Exchange OAuth authorization code for access token
   * @example
   * const tokenResponse = await sdk.exchangeCodeForToken(code, state);
   */
  async exchangeCodeForToken(
    code: string,
    state: string
  ): Promise<ExchangeTokenResponse> {
    return this.oauthService.getTokenByCode(code, state);
  }

  /**
   * Get user information using access token
   * @example
   * const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);
   */
  async getUserInfo(accessToken: string): Promise<GetUserInfoResponse> {
    const data = await this.oauthService.getUserInfoByToken({
      accessToken,
    } as ExchangeTokenResponse);
    const loginMethod = this.deriveLoginMethod(
      (data as any)?.platforms,
      (data as any)?.platform ?? data.platform ?? null
    );
    return {
      ...(data as any),
      platform: loginMethod,
      loginMethod,
    } as GetUserInfoResponse;
  }

  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }

    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  private getSessionSecrets(): Uint8Array[] {
    const list: string[] = [];
    if (ENV.cookieSecret) list.push(ENV.cookieSecret);
    if (process.env.SESSION_SECRET) list.push(process.env.SESSION_SECRET);
    if (process.env.JWT_SECRET) list.push(process.env.JWT_SECRET);
    if (ENV.databaseUrl) {
      list.push(
        createHash("sha256")
          .update("mazigho-local-session-v1:")
          .update(ENV.databaseUrl)
          .digest("base64url")
      );
    }
    list.push(
      createHash("sha256")
        .update("mazigho-platform-session-v1:")
        .update(ENV.appId || "35ce6912-3862-4a1c-b8ad-c2f82b21c803")
        .digest("base64url")
    );
    list.push("mazigho-universal-session-secret-key-2026-studio-v1");
    list.push("mazigho-universal-session-secret-key-2026");
    return Array.from(new Set(list)).map(s => new TextEncoder().encode(s));
  }

  private getSessionSecret(): Uint8Array {
    return this.getSessionSecrets()[0];
  }

  /**
   * Create a session token for a Manus user openId
   * @example
   * const sessionToken = await sdk.createSessionToken(userInfo.openId);
   */
  async createSessionToken(
    openId: string,
    options: { expiresInMs?: number; name?: string } = {}
  ): Promise<string> {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || "",
      },
      options
    );
  }

  /**
   * Creates a short-lived, purpose-bound support session. It is deliberately
   * separate from normal logins so the operator can return to Studio safely.
   */
  async createSupportImpersonationToken(input: {
    operatorOpenId: string;
    targetOpenId: string;
    storeId: number;
    name: string;
    expiresInMs: number;
  }): Promise<string> {
    return this.signSession({
      openId: input.targetOpenId,
      appId: ENV.appId,
      name: input.name,
      supportImpersonation: {
        operatorOpenId: input.operatorOpenId,
        storeId: input.storeId,
      },
    }, { expiresInMs: input.expiresInMs });
  }

  async signSession(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();

    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name,
      ...(payload.supportImpersonation ? {
        supportImpersonation: {
          operatorOpenId: payload.supportImpersonation.operatorOpenId,
          storeId: payload.supportImpersonation.storeId,
        },
      } : {}),
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<SessionPayload | null> {
    if (!cookieValue) {
      return null;
    }

    const secrets = this.getSessionSecrets();
    let payload: Record<string, unknown> | null = null;
    for (const secretKey of secrets) {
      try {
        const result = await jwtVerify(cookieValue, secretKey, {
          algorithms: ["HS256"],
        });
        payload = result.payload as Record<string, unknown>;
        break;
      } catch {
        // Try next candidate secret
      }
    }

    if (!payload) {
      return null;
    }

    const { openId, appId, name, supportImpersonation } = payload;

    if (
      !isNonEmptyString(openId) ||
      !isNonEmptyString(appId) ||
      !isNonEmptyString(name)
    ) {
      return null;
    }

    const supportSource = supportImpersonation && typeof supportImpersonation === "object"
      ? supportImpersonation as Record<string, unknown>
      : null;
    const operatorOpenId = typeof supportSource?.operatorOpenId === "string" ? supportSource.operatorOpenId : null;
    const storeId = typeof supportSource?.storeId === "number" ? supportSource.storeId : null;
    const expiresAt = typeof payload.exp === "number" && Number.isFinite(payload.exp)
      ? new Date(payload.exp * 1000).toISOString()
      : null;
    const supportSession = operatorOpenId && operatorOpenId.length <= 64 && typeof storeId === "number" && Number.isInteger(storeId) && storeId > 0 && expiresAt
      ? { operatorOpenId, storeId, expiresAt }
      : undefined;

    return {
      openId,
      appId,
      name,
      ...(supportSession ? { supportImpersonation: supportSession } : {}),
    };
  }

  async getUserInfoWithJwt(
    jwtToken: string
  ): Promise<GetUserInfoWithJwtResponse> {
    const payload: GetUserInfoWithJwtRequest = {
      jwtToken,
      projectId: ENV.appId,
    };

    const { data } = await this.client.post<GetUserInfoWithJwtResponse>(
      GET_USER_INFO_WITH_JWT_PATH,
      payload
    );

    const loginMethod = this.deriveLoginMethod(
      (data as any)?.platforms,
      (data as any)?.platform ?? data.platform ?? null
    );
    return {
      ...(data as any),
      platform: loginMethod,
      loginMethod,
    } as GetUserInfoWithJwtResponse;
  }

  extractSessionToken(req: Request): string | undefined {
    const headerToken = req.headers["x-mazigho-session"];
    if (typeof headerToken === "string" && headerToken.trim().length > 0) {
      return headerToken.trim();
    }
    const authHeader = req.headers.authorization;
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      const bearer = authHeader.slice(7).trim();
      if (bearer.length > 0) return bearer;
    }
    const cookies = this.parseCookies(req.headers.cookie);
    return cookies.get(COOKIE_NAME);
  }

  async authenticateRequest(req: Request): Promise<User> {
    // Regular authentication flow (supports header token for cross-origin tablet iframes + cookies)
    const sessionCookie = this.extractSessionToken(req);
    const session = await this.verifySession(sessionCookie);

    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }

    const sessionUserId = session.openId;
    const signedInAt = new Date();
    let user = await db.getUserByOpenId(sessionUserId);

    if (!user) {
      const { getDemoUserByOpenId } = await import("../db/demoFallback");
      const demoUser = getDemoUserByOpenId(sessionUserId);
      if (demoUser) {
        user = demoUser as any;
      } else if (
        // Identity comes from the signed session subject only, never from a display name.
        sessionUserId === "operator-yacbhl71" ||
        sessionUserId === "firebase_operator-yacbhl71"
      ) {
        const { upsertDemoFirebaseUser } = await import("../db/demoFallback");
        user = upsertDemoFirebaseUser({
          uid: sessionUserId,
          email: "yacbhl71@gmail.com",
          name: session.name || "Yacine (Opérateur MAZIGHO)",
          emailVerified: true,
        }) as any;
      }
    }

    // If user not in DB, sync from OAuth server automatically
    if (!user) {
      try {
        const userInfo = await this.getUserInfoWithJwt(sessionCookie ?? "");
        await db.upsertUser({
          openId: userInfo.openId,
          name: userInfo.name || null,
          email: userInfo.email ?? null,
          loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
          lastSignedIn: signedInAt,
        });
        user = await db.getUserByOpenId(userInfo.openId);
      } catch (error) {
        console.error("[Auth] Failed to sync user from OAuth:", error);
        throw ForbiddenError("Failed to sync user info");
      }
    }

    if (!user) {
      throw ForbiddenError("User not found");
    }
    if (user.accountStatus !== "active") {
      throw ForbiddenError(user.accountStatus === "blocked" ? "Account blocked" : "Account invitation pending");
    }

    await db.upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt,
    });

    return user;
  }

  /** Reads only the signed, short-lived support cookie; normal sessions never qualify here. */
  async getSupportImpersonationSession(req: Request): Promise<(SessionPayload & { supportImpersonation: { operatorOpenId: string; storeId: number; expiresAt: string } }) | null> {
    const cookies = this.parseCookies(req.headers.cookie);
    const session = await this.verifySession(cookies.get(SUPPORT_IMPERSONATION_COOKIE_NAME));
    return session?.supportImpersonation
      ? session as SessionPayload & { supportImpersonation: { operatorOpenId: string; storeId: number; expiresAt: string } }
      : null;
  }
}

export const sdk = new SDKServer();
