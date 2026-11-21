import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, CheckCircle2, Eye, EyeOff, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
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
  const isDedicatedAdminLogin = location.split("?")[0] === "/connexion-administration";
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : location.split("?")[1] || "");
  const storeProjectIntent = params.get("intent") === "boutique";
  const candidateReturn = params.get("returnTo") || "";
  const independentSiteIntent = isDedicatedAdminLogin || params.get("intent") === "independent" || /^\/constructeur-sites\/invitation\/[A-Za-z0-9_-]{20,200}$/.test(candidateReturn);
  const setupOwnerReturnTo = getSafeSetupOwnerPanelReturnTo(candidateReturn);
  const invitationReturnTo = candidateReturn.match(/^\/constructeur-sites\/invitation\/[A-Za-z0-9_-]{20,200}$/)?.[0] ?? "";
  const hasBoutiqueAccessIntent = !independentSiteIntent && (storeProjectIntent || Boolean(setupOwnerReturnTo));
  const independentSiteReturnTo = /^\/constructeur-sites\?siteSlug=[a-z0-9-]{1,120}$/.test(candidateReturn) ? candidateReturn : "";
  const publicSiteReturnTo = /^\/sites\/[a-z0-9-]{1,120}$/.test(candidateReturn) ? candidateReturn : "";
  const returnTo = invitationReturnTo || independentSiteReturnTo || publicSiteReturnTo || setupOwnerReturnTo || (candidateReturn.startsWith("/demarrer-boutique") ? candidateReturn : "/demarrer-boutique?plan=free");
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
      {independentSiteIntent ? <header className="border-b border-[#d9dfcf] bg-[#f7f5f2]"><div className="mx-auto flex min-h-16 max-w-5xl items-center justify-between px-4"><span className="text-sm font-bold tracking-wide text-[#59634c]">CONNEXION ADMINISTRATEUR DU SITE</span><span className="text-xs font-semibold text-slate-500">Accès sécurisé</span></div></header> : hasBoutiqueAccessIntent ? <header className="border-b border-[#e5e4da] bg-[#fffefb]"><div className="container mx-auto flex min-h-16 items-center justify-between px-4"><Link href={returnTo} className="text-sm font-bold text-[#596a32]">MAZIGHO · Projet boutique</Link><span className="text-xs font-semibold text-slate-500">Accès propriétaire</span></div></header> : <Header />}
      <main className={independentSiteIntent ? "flex-1 md:grid md:grid-cols-2" : "flex-1"}>
        <section className="py-12 md:py-16" style={{ background: independentSiteIntent ? "linear-gradient(135deg, #eef2e8 0%, #f9fbf6 55%, #ffffff 100%)" : `linear-gradient(135deg, ${palette.soft}, #ffffff)` }}><div className="mx-auto max-w-2xl px-6 md:px-10 lg:px-16"><Link href={independentSiteIntent ? returnTo : hasBoutiqueAccessIntent ? returnTo : "/"}><div className="mb-8 flex w-fit cursor-pointer items-center gap-2 font-medium" style={{ color: independentSiteIntent ? "#59634c" : palette.accent }}><ArrowLeft className="h-5 w-5" /><span>{independentSiteIntent ? "Retour au site" : hasBoutiqueAccessIntent ? "Retour à mon projet de boutique" : copy.back}</span></div></Link><h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-800 md:text-5xl">{independentSiteIntent ? "Gérez votre site en toute simplicité" : hasBoutiqueAccessIntent ? "Reprendre mon projet de boutique" : copy.login.title}</h1><p className="max-w-xl text-lg leading-8 text-gray-600">{independentSiteIntent ? "Retrouvez les outils nécessaires pour mettre à jour les pages, les images et les informations de votre site." : hasBoutiqueAccessIntent ? "Connectez-vous pour continuer la préparation de votre boutique MAZIGHO." : copy.login.lead}</p>{independentSiteIntent && <><div className="mt-7 grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-[#d9dfcf] bg-white/75 p-3 shadow-sm"><CheckCircle2 className="h-5 w-5 text-[#687454]" /><p className="mt-2 text-xs font-semibold text-slate-700">Votre site uniquement</p></div><div className="rounded-2xl border border-[#d9dfcf] bg-white/75 p-3 shadow-sm"><ShieldCheck className="h-5 w-5 text-[#687454]" /><p className="mt-2 text-xs font-semibold text-slate-700">Accès sécurisé</p></div><div className="rounded-2xl border border-[#d9dfcf] bg-white/75 p-3 shadow-sm"><Sparkles className="h-5 w-5 text-[#687454]" /><p className="mt-2 text-xs font-semibold text-slate-700">Droits adaptés</p></div></div><div className="relative mt-10 hidden max-w-md overflow-hidden rounded-[2rem] border border-[#d9dfcf] bg-white/80 p-4 shadow-2xl shadow-[#687454]/15 sm:block"><div className="flex items-center gap-1.5 border-b border-slate-100 pb-3"><span className="h-2.5 w-2.5 rounded-full bg-[#d9a49b]" /><span className="h-2.5 w-2.5 rounded-full bg-[#e8cf91]" /><span className="h-2.5 w-2.5 rounded-full bg-[#9aaa83]" /><span className="ml-2 h-2 rounded-full bg-slate-100" style={{ width: "42%" }} /></div><div className="mt-4 grid grid-cols-[72px_1fr] gap-3"><div className="space-y-2 rounded-xl bg-[#59634c] p-2"><div className="h-2 w-8 rounded bg-white/70" /><div className="h-2 w-11 rounded bg-white/30" /><div className="h-2 w-9 rounded bg-white/30" /><div className="mt-6 h-2 w-10 rounded bg-white/30" /></div><div className="space-y-3 rounded-xl bg-[#f7f5f2] p-3"><div className="h-3 w-2/3 rounded bg-[#59634c]/20" /><div className="grid grid-cols-2 gap-2"><div className="h-16 rounded-xl bg-[#d9dfcf]" /><div className="h-16 rounded-xl bg-[#ead8c9]" /></div><div className="h-2 w-1/2 rounded bg-slate-200" /></div></div><div className="absolute -bottom-3 -right-3 rounded-2xl border border-[#d9dfcf] bg-white px-4 py-3 shadow-lg"><p className="text-xs font-semibold text-[#59634c]">Prêt à mettre à jour</p></div></div></>}</div></section>
        <section className="py-14 md:py-20"><div className="container mx-auto max-w-md px-4"><Card><CardContent className="p-7 md:p-8"><div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: independentSiteIntent ? "#eef2e8" : palette.soft, color: independentSiteIntent ? "#59634c" : palette.primary }}><LockKeyhole className="h-7 w-7" /></div><h2 className="text-center text-2xl font-semibold text-gray-800">{independentSiteIntent ? "Connexion à votre espace de gestion" : copy.login.cardTitle}</h2><p className="mt-2 text-center text-sm text-gray-600">{independentSiteIntent ? "Vos identifiants vous donnent accès uniquement au site attribué." : copy.login.cardLead}</p>
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
      {independentSiteIntent ? <footer className="border-t border-[#d9dfcf] bg-[#f7f5f2] px-4 py-5 text-center text-xs text-slate-500">Cet accès est limité au site qui vous a été attribué.</footer> : hasBoutiqueAccessIntent ? <footer className="border-t border-[#e5e4da] bg-[#fffefb] px-4 py-5 text-center text-xs text-slate-500">Cet accès est réservé à la préparation de votre boutique MAZIGHO.</footer> : <Footer />}
    </div>
  );
}
