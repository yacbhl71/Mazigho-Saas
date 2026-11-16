import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  membership: { role: "owner", status: "active" } as { role: string; status: string } | null,
  user: {
    id: 113,
    openId: "owner-login-test",
    name: "Propriétaire test",
    email: "owner@example.test",
    passwordHash: "scrypt-v1$test",
    accountStatus: "active",
    role: "user",
    createdAt: new Date("2026-10-01T00:00:00.000Z"),
    updatedAt: new Date("2026-10-01T00:00:00.000Z"),
    lastSignedIn: new Date("2026-10-01T00:00:00.000Z"),
  },
}));

vi.mock("./db", () => ({
  activateAccountFromInvitation: vi.fn(),
  createPasswordUser: vi.fn(),
  getFirstActiveOwnerStoreForUser: vi.fn(),
  getStoreMembershipForUser: vi.fn(async () => state.membership),
  getUserByEmail: vi.fn(async () => state.user),
  markUserSignedIn: vi.fn(),
  requestPasswordResetToken: vi.fn(),
  resetPasswordFromToken: vi.fn(),
  updatePasswordUser: vi.fn(),
}));

vi.mock("./localAuth", () => ({
  hashPassword: vi.fn(async () => "scrypt-v1$test"),
  verifyPassword: vi.fn(async () => true),
}));

vi.mock("./transactionalEmail", () => ({
  isTransactionalEmailConfigured: vi.fn(() => false),
  sendPasswordResetEmail: vi.fn(),
}));

vi.mock("./_core/sdk", () => ({
  sdk: { createSessionToken: vi.fn(async () => "signed-session-token") },
}));

import * as db from "./db";
import { authRouter } from "./authRouter";
import { resetAuthRateLimitForTests } from "./authRateLimit";

function callerFor(store: { id: number; isPlatformStore: number; status: string; primaryDomain: string }) {
  const cookie = vi.fn();
  return {
    client: authRouter.createCaller({
      user: null,
      store,
      req: {
        protocol: "http",
        hostname: store.primaryDomain,
        headers: { "x-forwarded-proto": "https" },
        ip: "203.0.113.56",
        socket: { remoteAddress: "203.0.113.56" },
      },
      res: { cookie, clearCookie: vi.fn() },
    } as any),
    cookie,
  };
}

describe("connexion propriétaire sur une boutique cliente", () => {
  beforeEach(() => {
    resetAuthRateLimitForTests();
    state.membership = { role: "owner", status: "active" };
    vi.clearAllMocks();
  });

  it("retourne uniquement la boutique actuellement résolue lorsqu’un propriétaire s’y connecte", async () => {
    const { client, cookie } = callerFor({ id: 11340011, isPlatformStore: 0, status: "active", primaryDomain: "bhll-boutique.mazigho.ch" });

    await expect(client.login({ email: "owner@example.test", password: "mot-de-passe-valide" })).resolves.toMatchObject({
      user: { id: 113, role: "user" },
      ownerStore: { id: 11340011, primaryDomain: "bhll-boutique.mazigho.ch", status: "active" },
    });
    expect(db.getStoreMembershipForUser).toHaveBeenCalledWith(11340011, 113);
    expect(cookie).toHaveBeenCalledWith("app_session_id", "signed-session-token", expect.objectContaining({
      domain: ".mazigho.ch",
      httpOnly: true,
      secure: true,
      sameSite: "lax",
    }));
  });

  it("ne retourne pas de destination propriétaire sans rôle owner actif sur la boutique courante", async () => {
    state.membership = { role: "manager", status: "active" };
    const { client } = callerFor({ id: 11340011, isPlatformStore: 0, status: "active", primaryDomain: "bhll-boutique.mazigho.ch" });

    await expect(client.login({ email: "owner@example.test", password: "mot-de-passe-valide" })).resolves.toMatchObject({
      user: { id: 113 },
      ownerStore: null,
    });
  });

  it("efface la session MAZIGHO partagée et une éventuelle ancienne session locale", async () => {
    const clearedCookies: Array<{ name: string; options: Record<string, unknown> }> = [];
    const client = authRouter.createCaller({
      user: null,
      store: null,
      req: {
        protocol: "http",
        hostname: "bhll-boutique.mazigho.ch",
        headers: { "x-forwarded-proto": "https" },
      },
      res: {
        cookie: vi.fn(),
        clearCookie: (name: string, options: Record<string, unknown>) => clearedCookies.push({ name, options }),
      },
    } as any);

    await expect(client.logout()).resolves.toEqual({ success: true });
    expect(clearedCookies).toEqual([
      { name: "app_session_id", options: expect.objectContaining({ domain: ".mazigho.ch", maxAge: -1, secure: true }) },
      { name: "app_session_id", options: expect.objectContaining({ maxAge: -1, secure: true }) },
    ]);
    expect(clearedCookies[1]?.options).not.toHaveProperty("domain");
  });

  it("n'enrôle le super-admin sur une base vide qu'avec le secret serveur SUPER_ADMIN_BOOTSTRAP_PASSWORD", async () => {
    const superAdmin = {
      id: 1,
      openId: "operator-yacbhl71",
      name: "Yacine (Super Admin)",
      email: "yacbhl71@gmail.com",
      passwordHash: "scrypt-v1$test",
      accountStatus: "active",
      role: "admin",
      loginMethod: "password",
      createdAt: new Date("2026-10-28T00:00:00.000Z"),
      updatedAt: new Date("2026-10-28T00:00:00.000Z"),
      lastSignedIn: new Date("2026-10-28T00:00:00.000Z"),
    } as any;
    const { client } = callerFor({ id: 1, isPlatformStore: 1, status: "active", primaryDomain: "studio.mazigho.com" });

    vi.mocked(db.getUserByEmail).mockResolvedValueOnce(undefined);
    await expect(client.login({ email: "yacbhl71@gmail.com", password: "MonMotDePassePersonnel12" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(db.createPasswordUser).not.toHaveBeenCalled();

    process.env.SUPER_ADMIN_BOOTSTRAP_PASSWORD = "MonMotDePassePersonnel12";
    try {
      vi.mocked(db.getUserByEmail).mockResolvedValueOnce(undefined);
      await expect(client.login({ email: "yacbhl71@gmail.com", password: "UnAutreMotDePasse99" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
      vi.mocked(db.getUserByEmail).mockResolvedValueOnce(undefined);
      vi.mocked(db.createPasswordUser).mockResolvedValueOnce(superAdmin);
      await expect(client.login({ email: "yacbhl71@gmail.com", password: "MonMotDePassePersonnel12" })).resolves.toMatchObject({
        user: { email: "yacbhl71@gmail.com", role: "admin", accountStatus: "active" },
      });
      expect(db.createPasswordUser).toHaveBeenCalledWith(expect.objectContaining({ openId: "operator-yacbhl71", email: "yacbhl71@gmail.com", role: "admin" }));
    } finally {
      delete process.env.SUPER_ADMIN_BOOTSTRAP_PASSWORD;
    }
  });

  it("refuse un mauvais mot de passe pour un compte administrateur existant, sans le modifier", async () => {
    vi.mocked(db.getUserByEmail).mockResolvedValueOnce({ ...state.user, email: "yacbhl71@gmail.com", openId: "operator-yacbhl71", role: "admin" } as any);
    const { verifyPassword } = await import("./localAuth");
    vi.mocked(verifyPassword).mockResolvedValueOnce(false);
    const { client } = callerFor({ id: 1, isPlatformStore: 1, status: "active", primaryDomain: "studio.mazigho.ch" });
    await expect(client.login({ email: "yacbhl71@gmail.com", password: "nimportequoi" })).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(db.updatePasswordUser).not.toHaveBeenCalled();
  });

  it("n'accorde jamais de rôle à l'inscription, même avec une adresse @mazigho.ch", async () => {
    vi.mocked(db.getUserByEmail).mockResolvedValueOnce(undefined);
    vi.mocked(db.createPasswordUser).mockResolvedValueOnce({ ...state.user, email: "intrus@mazigho.ch", role: "user" } as any);
    const { client } = callerFor({ id: 1, isPlatformStore: 1, status: "active", primaryDomain: "studio.mazigho.ch" });
    await client.register({ name: "Intrus", email: "intrus@mazigho.ch", password: "MotDePasse123" });
    const created = vi.mocked(db.createPasswordUser).mock.calls.at(-1)?.[0];
    expect(created?.role).toBeUndefined();
    expect(created?.openId).toMatch(/^local_/);
  });

  it("refuse l'inscription sur une adresse existante, y compris celle du super-admin", async () => {
    vi.mocked(db.getUserByEmail).mockResolvedValueOnce({ ...state.user, email: "yacbhl71@gmail.com", openId: "operator-yacbhl71", role: "admin" } as any);
    const { client } = callerFor({ id: 1, isPlatformStore: 1, status: "active", primaryDomain: "studio.mazigho.ch" });
    await expect(client.register({ name: "Intrus", email: "yacbhl71@gmail.com", password: "MotDePasse123" })).rejects.toMatchObject({ code: "CONFLICT" });
    expect(db.updatePasswordUser).not.toHaveBeenCalled();
  });
});

