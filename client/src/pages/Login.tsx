import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
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
import { signInWithGoogleFirebase } from "@/lib/firebase";

export default function Login() {
  const [location, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { locale } = useLocale();
  const { profile, palette } = useDesignProfile(locale);
  const brandName = getStorefrontBrandName(profile);
  const copy = withStorefrontBrand( getAuthCopy(locale), brandName);
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : location.split("?")[1] || "");
  const storeProjectIntent = params.get("intent") === "boutique";
  const candidateReturn = params.get("returnTo") || "";
  const setupOwnerReturnTo = getSafeSetupOwnerPanelReturnTo(candidateReturn);
  const invitationReturnTo = candidateReturn.match(/^\/constructeur-sites\/invitation\/[A-Za-z0-9_-]{20,200}$/)?.[0] ?? "";
  const hasBoutiqueAccessIntent = storeProjectIntent || Boolean(setupOwnerReturnTo);
  const returnTo = invitationReturnTo || setupOwnerReturnTo || (candidateReturn.startsWith("/demarrer-boutique") ? candidateReturn : "/demarrer-boutique?plan=free");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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
    if (data.ownerStore) {
      window.location.assign("/gestion-boutique");
      return;
    }
    const target = invitationReturnTo
      ? invitationReturnTo
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
      const data = await firebaseLogin.mutateAsync({ idToken: fbUser.idToken });
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
    <div className="flex min-h-screen flex-col bg-white">
      {hasBoutiqueAccessIntent ? <header className="border-b border-[#e5e4da] bg-[#fffefb]"><div className="container mx-auto flex min-h-16 items-center justify-between px-4"><Link href={returnTo} className="text-sm font-bold text-[#596a32]">MAZIGHO · Projet boutique</Link><span className="text-xs font-semibold text-slate-500">Accès propriétaire</span></div></header> : <Header />}
      <main className="flex-1">
        <section className="py-12 md:py-16" style={{ background: `linear-gradient(135deg, ${palette.soft}, #ffffff)` }}><div className="container mx-auto px-4"><Link href={hasBoutiqueAccessIntent ? returnTo : "/"}><div className="mb-6 flex w-fit cursor-pointer items-center gap-2 font-medium" style={{ color: palette.accent }}><ArrowLeft className="h-5 w-5" /><span>{hasBoutiqueAccessIntent ? "Retour à mon projet de boutique" : copy.back}</span></div></Link><h1 className="mb-4 text-4xl font-bold text-gray-800 md:text-5xl">{hasBoutiqueAccessIntent ? "Reprendre mon projet de boutique" : copy.login.title}</h1><p className="max-w-2xl text-lg text-gray-600">{hasBoutiqueAccessIntent ? "Connectez-vous pour continuer la préparation de votre boutique MAZIGHO." : copy.login.lead}</p></div></section>
        <section className="py-14 md:py-20"><div className="container mx-auto max-w-md px-4"><Card><CardContent className="p-7 md:p-8"><div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: palette.soft, color: palette.primary }}><LockKeyhole className="h-7 w-7" /></div><h2 className="text-center text-2xl font-semibold text-gray-800">{copy.login.cardTitle}</h2><p className="mt-2 text-center text-sm text-gray-600">{copy.login.cardLead}</p>
          <div className="mt-6">
            <Button
              type="button"
              variant="outline"
              disabled={googleLoading || login.isPending || firebaseLogin.isPending}
              onClick={handleGoogleSignIn}
              className="w-full border-slate-300 bg-white font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer"
            >
              {googleLoading ? "Connexion Google en cours..." : "Continuer avec Google"}
            </Button>
          </div>
          <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
            <div className="h-px flex-1 bg-slate-200" />
            <span>ou avec vos identifiants e-mail</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <form className="space-y-5" onSubmit={handleSubmit}><div className="space-y-2"><Label htmlFor="login-email">{copy.email}</Label><Input id="login-email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="vous@exemple.ch" required /></div><div className="space-y-2"><div className="flex items-center justify-between gap-3"><Label htmlFor="login-password">{copy.password}</Label><Link href="/mot-de-passe-oublie" className="text-xs font-medium" style={{ color: palette.accent }}>{copy.login.forgot}</Link></div><div className="relative"><Input id="login-password" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} minLength={1} required className="pr-11" placeholder="Votre mot de passe" /><button type="button" onClick={() => setShowPassword(value => !value)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-gray-500 hover:text-gray-800" aria-label={showPassword ? copy.hidePassword : copy.showPassword}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div><Button type="submit" disabled={login.isPending} className="w-full text-white" style={{ backgroundColor: palette.accent }}>{login.isPending ? copy.login.submitting : copy.login.submit}</Button></form>
          <p className="mt-6 text-center text-sm text-gray-600">{copy.login.noAccount} <Link href={hasBoutiqueAccessIntent ? `/register?intent=boutique&returnTo=${encodeURIComponent(returnTo)}` : "/register"} className="font-semibold" style={{ color: palette.accent }}>{copy.login.register}</Link></p></CardContent></Card><div className="mt-7 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-left"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-700" /><p className="text-sm text-green-900">{copy.login.security}</p></div></div></section>
      </main>
      {hasBoutiqueAccessIntent ? <footer className="border-t border-[#e5e4da] bg-[#fffefb] px-4 py-5 text-center text-xs text-slate-500">Cet accès est réservé à la préparation de votre boutique MAZIGHO.</footer> : <Footer />}
    </div>
  );
}
