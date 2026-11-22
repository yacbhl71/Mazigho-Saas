import { randomUUID, timingSafeEqual } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { sdk } from "./_core/sdk";
import { ENV } from "./_core/env";
import {
  activateAccountFromInvitation,
  createGuestCustomer,
  createPasswordUser,
  deleteIndependentShadowUser,
  getUserByEmail,
  getIndependentUserByEmail,
  getUserByOpenId,
  getFirstActiveOwnerStoreForUser,
  getOwnerStoreSwitcherOptionsForUser,
  getStoreMembershipForUser,
  markUserSignedIn,
  requestPasswordResetToken,
  resetPasswordFromToken,
  updatePasswordUser,
} from "./db";
import { hashPassword, verifyPassword } from "./localAuth";
import {
  isTransactionalEmailConfigured,
  sendPasswordResetEmail,
} from "./transactionalEmail";
import {
  acceptIndependentSiteInvitation,
  inspectIndependentSiteInvitation,
} from "./isolatedSiteBuilderDb";
import {
  checkAuthRateLimit,
  clearAuthRateLimit,
  consumeAuthRateLimit,
  getAuthRateLimitMessage,
  type AuthRateLimitAction,
} from "./authRateLimit";

const emailSchema = z.string().trim().email("Adresse e-mail invalide").max(320);
const passwordSchema = z
  .string()
  .min(8, "Le mot de passe doit comporter au moins 8 caractères")
  .max(128, "Le mot de passe est trop long");
const currentPasswordSchema = z
  .string()
  .min(1, "Le mot de passe est requis")
  .max(128, "Le mot de passe est trop long");
const tokenSchema = z.string().min(32, "Lien invalide").max(256, "Lien invalide");

function safeUser<T extends { passwordHash?: string | null }>(user: T) {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

function rethrowTokenError(error: unknown): never {
  const code = String(error);
  if (code.includes("TOKEN_INVALID_OR_EXPIRED") || code.includes("INVITATION_ACTIVATION_FAILED")) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Ce lien est invalide, expiré ou a déjà été utilisé.",
    });
  }
  throw error;
}

const SUPER_ADMIN_EMAIL = "yacbhl71@gmail.com";

/**
 * First super-admin enrolment on an empty database. Only possible when the
 * operator has set SUPER_ADMIN_BOOTSTRAP_PASSWORD on the server and types it.
 */
async function bootstrapSuperAdmin(email: string, password: string) {
  const secret = process.env.SUPER_ADMIN_BOOTSTRAP_PASSWORD?.trim();
  if (!secret || secret.length < 12 || email !== SUPER_ADMIN_EMAIL) return null;
  const received = Buffer.from(password);
  const expected = Buffer.from(secret);
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
  return await createPasswordUser({
    openId: ENV.ownerOpenId,
    email,
    name: "Yacine (Super Admin)",
    passwordHash: await hashPassword(password),
    role: "admin",
  });
}

function enforceAuthRateLimit(action: AuthRateLimitAction, request: Parameters<typeof checkAuthRateLimit>[1], subject: string) {
  const result = checkAuthRateLimit(action, request, subject);
  if (!result.allowed) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: getAuthRateLimitMessage(result.retryAfterSeconds),
    });
  }
}

const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;
/** Guest checkout sessions only need to last for the order and its follow-up. */
const GUEST_SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7;

async function createSession(
  ctx: { req: Parameters<typeof getSessionCookieOptions>[0]; res: any },
  user: { openId: string; name: string | null; email: string | null },
  maxAgeMs = SESSION_MAX_AGE_MS
) {
  const sessionToken = await sdk.createSessionToken(user.openId, {
    name: user.name || user.email || "Client MAZIGHO",
    ...(maxAgeMs !== SESSION_MAX_AGE_MS ? { expiresInMs: maxAgeMs } : {}),
  });
  const cookieOptions = getSessionCookieOptions(ctx.req);

  ctx.res.cookie(COOKIE_NAME, sessionToken, {
    ...cookieOptions,
    maxAge: maxAgeMs,
  });
  return sessionToken;
}

async function getCurrentStoreOwnerDestination(ctx: { store?: { id: number; isPlatformStore: number; status: string; primaryDomain: string } | null }, userId: number) {
  const store = ctx.store;
  if (!store || store.isPlatformStore) return null;
  const membership = await getStoreMembershipForUser(store.id, userId);
  if (membership?.role !== "owner" || membership.status !== "active") return null;
  return {
    id: store.id,
    primaryDomain: store.primaryDomain,
    status: store.status,
  };
}

export const authRouter = router({
  me: publicProcedure.query(opts => {
    if (!opts.ctx.user) return null;
    return {
      ...safeUser(opts.ctx.user),
      supportImpersonation: opts.ctx.supportImpersonation ? {
        storeId: opts.ctx.supportImpersonation.storeId,
        storeName: opts.ctx.store?.displayName || "Boutique cliente",
        operatorName: opts.ctx.supportImpersonation.operatorName,
        expiresAt: opts.ctx.supportImpersonation.expiresAt,
        readOnly: true as const,
      } : null,
    };
  }),

  myOwnedStores: protectedProcedure.query(({ ctx }) => getOwnerStoreSwitcherOptionsForUser(ctx.user.id)),

  register: publicProcedure
    .input(
      z.object({
        name: z.string().trim().min(2, "Indiquez votre nom").max(120),
        email: emailSchema,
        password: passwordSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const email = input.email.toLowerCase();
      enforceAuthRateLimit("register", ctx.req, email);
      consumeAuthRateLimit("register", ctx.req, email);
      const existingUser = await getUserByEmail(email);

      // Registration never grants a role and never touches an existing account:
      // an e-mail address alone does not prove ownership.
      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: existingUser.loginMethod === "guest"
            ? "Vous avez déjà commandé sans compte avec cette adresse. Utilisez « Mot de passe oublié » pour choisir votre mot de passe."
            : "Un compte existe déjà avec cette adresse e-mail. Cliquez sur 'Se connecter' ci-dessous.",
        });
      }

      const user = await createPasswordUser({
        openId: `local_${randomUUID()}`,
        email,
        name: input.name,
        passwordHash: await hashPassword(input.password),
      });

      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Impossible de créer le compte pour le moment.",
        });
      }

      const sessionToken = await createSession(ctx, user);
      return { user: safeUser(user), sessionToken };
    }),

  registerIndependentSiteAccess: publicProcedure
    .input(
      z.object({
        name: z.string().trim().min(2, "Indiquez votre nom").max(120),
        email: emailSchema,
        password: passwordSchema,
        invitationToken: tokenSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const email = input.email.toLowerCase();
      enforceAuthRateLimit("register", ctx.req, `${email}:independent`);
      const inspection = await inspectIndependentSiteInvitation(input.invitationToken, email);
      if (inspection.status !== "valid" || inspection.emailMatchesViewer !== true) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cette invitation est invalide, expirée ou ne correspond pas à cette adresse e-mail.",
        });
      }

      // Independent access deliberately uses a shadow user. The same e-mail may
      // already own a MAZIGHO/Shop account; its password must never be changed
      // by a site invitation.
      const user = await createPasswordUser({
        openId: `independent_${randomUUID()}`,
        email,
        name: input.name,
        passwordHash: await hashPassword(input.password),
      });
      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Impossible de créer l’accès indépendant pour le moment.",
        });
      }

      try {
        const accepted = await acceptIndependentSiteInvitation(user.id, input.invitationToken, email);
        const sessionToken = await createSession(ctx, user);
        return { user: safeUser(user), sessionToken, accepted };
      } catch (error) {
        await deleteIndependentShadowUser(user.openId);
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cette invitation n’est plus disponible. Aucun accès n’a été activé.",
          cause: error,
        });
      }
    }),

  /**
   * Checkout without an account: creates a passwordless customer for a new
   * address only. An existing address never receives a session here, so an
   * e-mail alone can never open someone else's account or orders.
   */
  startGuestCheckout: publicProcedure
    .input(z.object({ name: z.string().trim().min(2, "Indiquez votre nom").max(120), email: emailSchema }))
    .mutation(async ({ ctx, input }) => {
      const email = input.email.toLowerCase();
      enforceAuthRateLimit("guest_checkout", ctx.req, email);
      consumeAuthRateLimit("guest_checkout", ctx.req, email);
      const existingUser = await getUserByEmail(email);
      if (existingUser) {
        throw new TRPCError({
          code: "CONFLICT",
          message: existingUser.loginMethod === "guest" || !existingUser.passwordHash
            ? "Vous avez déjà commandé avec cette adresse. Recevez un lien par e-mail pour choisir un mot de passe, puis connectez-vous."
            : "Un compte existe déjà avec cette adresse e-mail. Connectez-vous pour commander.",
        });
      }
      const user = await createGuestCustomer({ openId: `guest_${randomUUID()}`, email, name: input.name });
      if (!user) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "La commande sans compte n’est pas disponible pour le moment." });
      }
      const sessionToken = await createSession(ctx, user, GUEST_SESSION_MAX_AGE_MS);
      return { user: safeUser(user), sessionToken };
    }),

  requestPasswordReset: publicProcedure
    .input(z.object({ email: emailSchema }))
    .mutation(async ({ ctx, input }) => {
      const email = input.email.toLowerCase();
      enforceAuthRateLimit("password_reset", ctx.req, email);
      consumeAuthRateLimit("password_reset", ctx.req, email);

      const request = await requestPasswordResetToken(email);
      const emailAvailable = isTransactionalEmailConfigured();

      if (request && emailAvailable) {
        try {
          await sendPasswordResetEmail({
            email: request.email,
            name: request.name,
            token: request.reset.token,
            tokenId: request.reset.id,
          });
        } catch (error) {
          console.error("[Auth] Password-reset e-mail could not be delivered", String(error));
        }
      }

      return { accepted: true, emailAvailable };
    }),

  completePasswordReset: publicProcedure
    .input(z.object({ token: tokenSchema, password: passwordSchema }))
    .mutation(async ({ ctx, input }) => {
      enforceAuthRateLimit("password_reset_complete", ctx.req, input.token);
      consumeAuthRateLimit("password_reset_complete", ctx.req, input.token);
      try {
        await resetPasswordFromToken({
          token: input.token,
          passwordHash: await hashPassword(input.password),
        });
        return { success: true };
      } catch (error) {
        return rethrowTokenError(error);
      }
    }),

  acceptInvitation: publicProcedure
    .input(z.object({ token: tokenSchema, password: passwordSchema }))
    .mutation(async ({ ctx, input }) => {
      enforceAuthRateLimit("invitation_activation", ctx.req, input.token);
      consumeAuthRateLimit("invitation_activation", ctx.req, input.token);
      try {
        const user = await activateAccountFromInvitation({
          token: input.token,
          passwordHash: await hashPassword(input.password),
        });
        const sessionToken = await createSession(ctx, user);
        const ownerStore = user.role === "user" ? await getFirstActiveOwnerStoreForUser(user.id) : null;
        return { user: safeUser(user), ownerStore, sessionToken };
      } catch (error) {
        return rethrowTokenError(error);
      }
    }),

  changePassword: protectedProcedure
    .input(
      z.object({
        currentPassword: currentPasswordSchema,
        newPassword: passwordSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const passwordMatches = await verifyPassword(
        input.currentPassword,
        ctx.user.passwordHash
      );
      if (!passwordMatches) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Le mot de passe actuel est incorrect.",
        });
      }

      const user = await updatePasswordUser({
        openId: ctx.user.openId,
        passwordHash: await hashPassword(input.newPassword),
      });
      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Impossible de modifier le mot de passe.",
        });
      }

      return { user: safeUser(user) };
    }),

  login: publicProcedure
    .input(z.object({ email: emailSchema, password: currentPasswordSchema, independent: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      const email = input.email.toLowerCase();
      // Administrators follow the same rules as everyone: stored password + rate limit.
      enforceAuthRateLimit("login", ctx.req, email);

      let user = input.independent
        ? await getIndependentUserByEmail(email)
        : await getUserByEmail(email);

      let passwordMatches = false;
      if (user?.passwordHash) {
        passwordMatches = await verifyPassword(
          input.password,
          user.passwordHash
        );
      }

      if (!user) {
        user = (await bootstrapSuperAdmin(email, input.password)) ?? undefined;
        passwordMatches = Boolean(user);
        // Perform equivalent work for an unknown email to limit timing-based
        // account enumeration.
        if (!user) await hashPassword(input.password);
      }

      if (!user || !passwordMatches) {
        consumeAuthRateLimit("login", ctx.req, email);
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Adresse e-mail ou mot de passe incorrect.",
        });
      }
      if (user.accountStatus === "pending_invitation") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Ce compte doit d’abord être activé depuis son invitation e-mail.",
        });
      }
      if (user.accountStatus === "blocked") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Ce compte est bloqué. Contactez le support MAZIGHO.",
        });
      }

      clearAuthRateLimit("login", ctx.req, email);
      await markUserSignedIn(user.openId);
      const sessionToken = await createSession(ctx, user);
      const ownerStore = await getCurrentStoreOwnerDestination(ctx, user.id);
      return { user: safeUser(user), ownerStore, sessionToken };
    }),

  firebaseLogin: publicProcedure
    .input(
      z.object({
        uid: z.string().trim().min(1).max(128).optional(),
        email: emailSchema.optional(),
        displayName: z.string().trim().min(1).max(120).optional(),
        invitationToken: tokenSchema.optional(),
        idToken: z.string().min(10, "Jeton Firebase requis"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      enforceAuthRateLimit("login", ctx.req, input.email?.toLowerCase() ?? "firebase");
      let decoded: { uid: string; email?: string; name?: string; email_verified?: boolean };
      try {
        const { adminAuth } = await import("./firebaseAdmin");
        decoded = await adminAuth.verifyIdToken(input.idToken);
      } catch {
        consumeAuthRateLimit("login", ctx.req, input.email?.toLowerCase() ?? "firebase");
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Connexion Google impossible : jeton Firebase invalide ou expiré.",
        });
      }

      if (!decoded.email || !decoded.email_verified) {
        consumeAuthRateLimit("login", ctx.req, decoded.email?.toLowerCase() ?? "firebase");
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Cette adresse Google doit être vérifiée avant de pouvoir ouvrir une session.",
        });
      }

      const verifiedEmail = decoded.email.toLowerCase();
      const displayName = decoded.name?.trim() || input.displayName?.trim() || verifiedEmail;

      if (input.invitationToken) {
        const inspection = await inspectIndependentSiteInvitation(input.invitationToken, verifiedEmail);
        if (inspection.status !== "valid" || inspection.emailMatchesViewer !== true) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cette invitation est invalide, expirée ou ne correspond pas à cette adresse e-mail." });
        }
        const independentOpenId = `independent_google_${decoded.uid}`;
        let independentUser = await getUserByOpenId(independentOpenId);
        let createdShadow = false;
        if (!independentUser) {
          independentUser = await createPasswordUser({ openId: independentOpenId, email: verifiedEmail, name: displayName, passwordHash: await hashPassword(randomUUID()) });
          createdShadow = true;
        }
        if (!independentUser) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Impossible de créer l’accès Google indépendant." });
        try {
          await acceptIndependentSiteInvitation(independentUser.id, input.invitationToken, verifiedEmail);
        } catch (error) {
          if (createdShadow) await deleteIndependentShadowUser(independentOpenId);
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cette invitation n’est plus disponible.", cause: error });
        }
        clearAuthRateLimit("login", ctx.req, verifiedEmail);
        const sessionToken = await createSession(ctx, independentUser);
        return { user: safeUser(independentUser), ownerStore: null, sessionToken };
      }

      let user = await getUserByEmail(verifiedEmail);
      if (!user) {
        const { upsertDemoFirebaseUser } = await import("./db/demoFallback");
        user = upsertDemoFirebaseUser({
          uid: decoded.uid,
          email: verifiedEmail,
          name: displayName,
          emailVerified: true,
        }) as any;
      }

      if (!user) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Impossible d'ouvrir la session Google.",
        });
      }

      clearAuthRateLimit("login", ctx.req, verifiedEmail);
      await markUserSignedIn(user.openId);
      const sessionToken = await createSession(ctx, user);
      const ownerStore = await getCurrentStoreOwnerDestination(ctx, user.id);
      return { user: safeUser(user), ownerStore, sessionToken };
    }),

  logout: publicProcedure.mutation(({ ctx }) => {
    const cookieOptions = getSessionCookieOptions(ctx.req);
    ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    if (cookieOptions.domain) {
      const { domain: _domain, ...hostOnlyCookieOptions } = cookieOptions;
      ctx.res.clearCookie(COOKIE_NAME, { ...hostOnlyCookieOptions, maxAge: -1 });
    }
    return { success: true } as const;
  }),
});
