import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";
import { useLocale } from "@/contexts/LocaleContext";
import { getAuthCopy } from "@/lib/authCopy";
import { useDesignProfile } from "@/hooks/useDesignProfile";
import { getStorefrontBrandName, withStorefrontBrand } from "@/lib/storefrontIdentity";
import { getSafeSetupOwnerPanelReturnTo } from "@shared/setupStoreOwnerAccess";
import { sanitizeIndependentAdministrationReturnTo } from "@shared/isolatedSiteBuilder";
import { signInWithGoogleFirebase } from "@/lib/firebase";

export default function Login() {
  const [location, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { locale } = useLocale();
  const { profile, palette } = useDesignProfile(locale);
  const brandName = getStorefrontBrandName(profile);
  const copy = withStorefrontBrand( getAuthCopy(locale), brandName);
  const isDedicatedAdminLogin = location.split("?")[0] === "/connexion-administration";
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : location.split("?")[1] || "");
  const storeProjectIntent = params.get("intent") === "boutique";
  const candidateReturn = params.get("returnTo") || "";
  const invitedEmailHint = (params.get("email") || "").trim();
  const independentSiteIntent =
    isDedicatedAdminLogin ||
    params.get("intent") === "independent" ||
    /^\/administration-site(?:\/|\?|$)/.test(candidateReturn) ||
    /^\/constructeur-sites(?:\/|\?|$)/.test(candidateReturn);
  const setupOwnerReturnTo = getSafeSetupOwnerPanelReturnTo(candidateReturn);
  const hasBoutiqueAccessIntent = !independentSiteIntent && (storeProjectIntent || Boolean(setupOwnerReturnTo));
  const publicSiteReturnTo = /^\/sites\/[a-z0-9-]{1,120}$/.test(candidateReturn) ? candidateReturn : "";
  const returnTo = independentSiteIntent
    ? sanitizeIndependentAdministrationReturnTo(candidateReturn)
    : publicSiteReturnTo ||
      setupOwnerReturnTo ||
      (candidateReturn.startsWith("/demarrer-boutique") ? candidateReturn : "/demarrer-boutique?plan=free");
  const independentInvitationToken = (() => {
    const match = returnTo.match(/^\/constructeur-sites\/invitation\/([^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : "";
  })();
  const [email, setEmail] = useState(invitedEmailHint);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const registerHref = independentSiteIntent
    ? `/register?intent=independent&returnTo=${encodeURIComponent(returnTo)}${
        invitedEmailHint ? `&email=${encodeURIComponent(invitedEmailHint)}` : ""
      }`
    : hasBoutiqueAccessIntent
      ? `/register?intent=boutique&returnTo=${encodeURIComponent(returnTo)}`
      : "/register";

  const handleAuthSuccess = async (
    data: { user: { role: string }; ownerStore?: unknown; sessionToken?: string }
  ) => {
    if (typeof window !== "undefined" && data.sessionToken) {
      window.localStorage.setItem("mazigho_session_token", data.sessionToken);
    }
    utils.auth.me.setData(undefined, data.user as any);
    await Promise.all([
      utils.auth.me.invalidate(),
      utils.workspace.getCurrent.invalidate(),
    ]);
    toast.success(copy.login.success);
    if (data.ownerStore && !independentSiteIntent) {
      window.location.assign("/gestion-boutique");
      return;
    }
    const target = independentSiteIntent || publicSiteReturnTo
      ? returnTo
      : data.user.role === "admin"
      ? (typeof window !== "undefined" &&
         (window.location.hostname.toLowerCase().includes("studio") ||
          window.location.hostname.toLowerCase() === "studio.mazigho.ch" ||
          window.location.hostname.toLowerCase() === "studio.mazigho.com")
           ? "/admin/studio"
           : "/admin")
      : hasBoutiqueAccessIntent
        ? returnTo
        : "/mon-compte";
    if (typeof window !== "undefined") {
      window.location.assign(target);
    } else {
      setLocation(target);
    }
  };

  const login = trpc.auth.login.useMutation({
    onSuccess: data => handleAuthSuccess(data),
    onError: error => toast.error(error.message || copy.login.error),
  });

  const firebaseLogin = trpc.auth.firebaseLogin.useMutation({
    onError: error => toast.error(error.message || copy.login.error),
  });

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      const fbUser = await signInWithGoogleFirebase();
      if (!fbUser.email) {
        toast.error("Aucune adresse e-mail associée à ce compte Google.");
        return;
      }
      const data = await firebaseLogin.mutateAsync({ idToken: fbUser.idToken, invitationToken: independentInvitationToken || undefined });
      await handleAuthSuccess(data);
    } catch (error: any) {
      console.error("[Firebase Auth]", error);
      const errorCode = error?.code || "";
      if (errorCode === "auth/unauthorized-domain") {
        toast.error(
          `Le domaine ${window.location.hostname} doit être ajouté dans Firebase Auth (Domaines autorisés). Utilisez vos identifiants e-mail entre-temps.`
        );
      } else if (errorCode === "auth/popup-closed-by-user") {
        toast.info("Connexion Google annulée.");
      } else {
        toast.error("Connexion Google non disponible. Utilisez vos identifiants e-mail.");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); login.mutate({ email, password }); };

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-[#f8fafc]">
      {independentSiteIntent ? (
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex min-h-16 max-w-5xl flex-wrap items-center justify-between gap-2 px-4 sm:px-6">
            <span className="text-sm font-bold text-[#1e3a2f]">
              Administration de votre site
            </span>
            <span className="text-xs text-slate-600">
              Espace privé réservé aux membres autorisés du site
            </span>
          </div>
        </header>
      ) : hasBoutiqueAccessIntent ? (
        <header className="border-b border-[#e5e4da] bg-[#fffefb]">
          <div className="container mx-auto flex min-h-16 items-center justify-between px-4">
            <Link href={returnTo} className="text-sm font-bold text-[#596a32]">
              MAZIGHO · Projet boutique
            </Link>
            <span className="text-xs font-semibold text-slate-500">
              Accès propriétaire
            </span>
          </div>
        </header>
      ) : (
        <Header />
      )}
      <main className={independentSiteIntent ? "flex-1 lg:grid lg:grid-cols-2" : "flex-1"}>
        <section
          className="py-10 md:py-16"
          style={{
            background: independentSiteIntent
              ? "#f8fafc"
              : `linear-gradient(135deg, ${palette.soft}, #ffffff)`,
          }}
        >
          <div className="mx-auto max-w-xl px-5 sm:px-8 lg:px-12">
            <Link href={independentSiteIntent ? returnTo : hasBoutiqueAccessIntent ? returnTo : "/"}>
              <div
                className="mb-6 flex w-fit cursor-pointer items-center gap-2 text-sm font-medium"
                style={{ color: independentSiteIntent ? "#1e3a2f" : palette.accent }}
              >
                <ArrowLeft className="h-4 w-4" />
                <span>
                  {independentSiteIntent
                    ? returnTo.startsWith("/constructeur-sites/invitation/")
                      ? "Retour à votre invitation"
                      : "Retour à l’administration du site"
                    : hasBoutiqueAccessIntent
                      ? "Retour à mon projet de boutique"
                      : copy.back}
                </span>
              </div>
            </Link>
            <h1 className="mb-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              {independentSiteIntent
                ? "Administrez votre site en toute simplicité"
                : hasBoutiqueAccessIntent
                  ? "Reprendre mon projet de boutique"
                  : copy.login.title}
            </h1>
            <p className="max-w-lg text-base leading-7 text-slate-600">
              {independentSiteIntent
                ? "Connectez-vous pour mettre à jour les textes, les images, les actualités et l’état de publication de votre site, sans aucun outil technique complexe."
                : hasBoutiqueAccessIntent
                  ? "Connectez-vous pour continuer la préparation de votre boutique MAZIGHO."
                  : copy.login.lead}
            </p>
            {independentSiteIntent && (
              <div className="mt-8 space-y-4 border-t border-slate-200 pt-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#1e3a2f]" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Accès direct à votre site uniquement
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                      Vous arrivez directement dans l’espace dédié de votre site, sans boutique ni accès à d’autres projets.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#1e3a2f]" />
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Permissions adaptées à votre rôle
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-600">
                      Propriétaire (owner), Administrateur (admin) ou Éditeur (editor) : vos droits sont appliqués automatiquement côté serveur.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
        <section className="py-10 md:py-16">
          <div className="mx-auto max-w-md px-4 sm:px-6">
            <Card className="border-slate-200 shadow-none">
              <CardContent className="p-6 sm:p-8">
                <div
                  className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: independentSiteIntent ? "#eef3f0" : palette.soft,
                    color: independentSiteIntent ? "#1e3a2f" : palette.primary,
                  }}
                >
                  <LockKeyhole className="h-6 w-6" />
                </div>
                <h2 className="text-center text-xl font-bold text-slate-900">
                  {independentSiteIntent
                    ? "Connexion à l’administration du site"
                    : copy.login.cardTitle}
                </h2>
                <p className="mt-2 text-center text-sm text-slate-600">
                  {independentSiteIntent
                    ? "Utilisez l’adresse e-mail autorisée pour accéder à l’administration de votre site."
                    : copy.login.cardLead}
                </p>
                {independentSiteIntent && invitedEmailHint && (
                  <div
                    className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-700"
                    role="status"
                  >
                    Adresse e-mail invitée :{" "}
                    <strong className="break-all text-[#1e3a2f]">{invitedEmailHint}</strong>.
                    Connectez-vous avec cette adresse exacte pour activer ou retrouver votre accès.
                  </div>
                )}
                <div className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={googleLoading || login.isPending || firebaseLogin.isPending}
                    onClick={handleGoogleSignIn}
                    className="min-h-[44px] w-full cursor-pointer border-slate-300 bg-white font-semibold text-slate-800 hover:bg-slate-50"
                  >
                    {googleLoading ? "Connexion Google en cours..." : "Continuer avec Google"}
                  </Button>
                </div>
                <div className="my-5 flex items-center gap-3 text-xs text-slate-500">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span>ou avec vos identifiants e-mail</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="space-y-1.5">
                    <Label htmlFor="login-email">{copy.email}</Label>
                    <Input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="vous@exemple.ch"
                      required
                      className="min-h-[44px]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="login-password">{copy.password}</Label>
                      <Link
                        href="/mot-de-passe-oublie"
                        className="text-xs font-medium hover:underline"
                        style={{ color: independentSiteIntent ? "#1e3a2f" : palette.accent }}
                      >
                        {copy.login.forgot}
                      </Link>
                    </div>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        minLength={1}
                        required
                        className="min-h-[44px] pr-11"
                        placeholder="Votre mot de passe"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((value) => !value)}
                        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a2f]"
                        aria-label={showPassword ? copy.hidePassword : copy.showPassword}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={login.isPending}
                    className="min-h-[44px] w-full text-white"
                    style={{ backgroundColor: independentSiteIntent ? "#1e3a2f" : palette.accent }}
                  >
                    {login.isPending ? copy.login.submitting : copy.login.submit}
                  </Button>
                </form>
                <p className="mt-6 text-center text-sm text-slate-600">
                  {copy.login.noAccount}{" "}
                  <Link
                    href={registerHref}
                    className="font-semibold underline-offset-2 hover:underline"
                    style={{ color: independentSiteIntent ? "#1e3a2f" : palette.accent }}
                  >
                    {independentSiteIntent
                      ? "Créer mon accès avec l’e-mail invité"
                      : copy.login.register}
                  </Link>
                </p>
              </CardContent>
            </Card>
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#1e3a2f]" />
              <p className="text-xs leading-relaxed text-slate-700">
                {independentSiteIntent
                  ? "Espace d’administration isolé : vos droits (Propriétaire, Administrateur ou Éditeur) s’appliquent exclusivement à votre site, sans accès au constructeur visuel global."
                  : copy.login.security}
              </p>
            </div>
          </div>
        </section>
      </main>
      {independentSiteIntent ? (
        <footer className="border-t border-slate-200 bg-white px-4 py-5 text-center text-xs text-slate-600">
          Accès sécurisé et strictement limité au site qui vous a été attribué.
        </footer>
      ) : hasBoutiqueAccessIntent ? (
        <footer className="border-t border-[#e5e4da] bg-[#fffefb] px-4 py-5 text-center text-xs text-slate-500">
          Cet accès est réservé à la préparation de votre boutique MAZIGHO.
        </footer>
      ) : (
        <Footer />
      )}
    </div>
  );
}
