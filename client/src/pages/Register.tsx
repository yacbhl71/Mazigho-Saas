import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Eye, EyeOff, ShieldCheck, UserPlus } from "lucide-react";
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
import { sanitizeIndependentAdministrationReturnTo } from "@shared/isolatedSiteBuilder";
import { signInWithGoogleFirebase } from "@/lib/firebase";

export default function Register() {
  const [location, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { locale } = useLocale();
  const { profile, palette } = useDesignProfile(locale);
  const brandName = getStorefrontBrandName(profile);
  const copy = withStorefrontBrand( getAuthCopy(locale), brandName);
  const params = new URLSearchParams(typeof window !== "undefined" ? window.location.search : location.split("?")[1] || "");
  const storeProjectIntent = params.get("intent") === "boutique";
  const candidateReturn = params.get("returnTo") || "";
  const invitedEmailHint = (params.get("email") || "").trim();
  const independentSiteIntent =
    params.get("intent") === "independent" ||
    /^\/constructeur-sites(?:\/|\?|$)/.test(candidateReturn);
  const returnTo = independentSiteIntent
    ? sanitizeIndependentAdministrationReturnTo(candidateReturn)
    : candidateReturn.startsWith("/demarrer-boutique")
      ? candidateReturn
      : "/demarrer-boutique?plan=free";
  const [name, setName] = useState("");
  const [email, setEmail] = useState(invitedEmailHint);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const loginHref = independentSiteIntent
    ? `/connexion-administration?returnTo=${encodeURIComponent(returnTo)}${
        invitedEmailHint ? `&email=${encodeURIComponent(invitedEmailHint)}` : ""
      }`
    : storeProjectIntent
      ? `/login?intent=boutique&returnTo=${encodeURIComponent(returnTo)}`
      : "/login";

  const resolvePostAuthDestination = (userRole?: string) => {
    if (independentSiteIntent) {
      return returnTo;
    }
    if (userRole === "admin") {
      const hostname = typeof window !== "undefined" ? window.location.hostname.toLowerCase() : "";
      if (hostname.includes("studio") || hostname === "studio.mazigho.com" || hostname === "studio.mazigho.ch") {
        return "/admin/studio";
      }
      return "/admin";
    }
    return storeProjectIntent ? returnTo : "/mon-compte";
  };

  const register = trpc.auth.register.useMutation({
    onSuccess: async data => {
      if (typeof window !== "undefined" && data.sessionToken) {
        window.localStorage.setItem("mazigho_session_token", data.sessionToken);
      }
      utils.auth.me.setData(undefined, data.user as any);
      await utils.auth.me.invalidate();
      toast.success(copy.register.success);
      const destination = resolvePostAuthDestination(data.user.role);
      if (typeof window !== "undefined") {
        window.location.assign(destination);
      } else {
        setLocation(destination);
      }
    },
    onError: error => toast.error(error.message || copy.register.error),
  });

  const firebaseLogin = trpc.auth.firebaseLogin.useMutation({
    onSuccess: async data => {
      if (typeof window !== "undefined" && data.sessionToken) {
        window.localStorage.setItem("mazigho_session_token", data.sessionToken);
      }
      utils.auth.me.setData(undefined, data.user as any);
      await utils.auth.me.invalidate();
      toast.success(copy.register.success);
      const destination = resolvePostAuthDestination(data.user.role);
      if (typeof window !== "undefined") {
        window.location.assign(destination);
      } else {
        setLocation(destination);
      }
    },
    onError: error => toast.error(error.message || copy.register.error),
  });

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      const fbUser = await signInWithGoogleFirebase();
      if (!fbUser.email) {
        toast.error("Aucune adresse e-mail associée à ce compte Google.");
        return;
      }
      await firebaseLogin.mutateAsync({ idToken: fbUser.idToken });
    } catch (error) {
      console.error("[Firebase Auth]", error);
      toast.error("Inscription Google interrompue ou refusée.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); if (password !== confirmation) { toast.error(copy.register.mismatch); return; } register.mutate({ name, email, password }); };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {independentSiteIntent ? <header className="border-b border-[#dfe7d0] bg-[#fbfcf8]"><div className="mx-auto flex min-h-16 max-w-5xl items-center justify-between px-4"><span className="text-sm font-bold tracking-wide text-[#40552d]">ESPACE DE GESTION DU SITE</span><span className="text-xs font-semibold text-slate-500">Espace indépendant · Sans boutique</span></div></header> : storeProjectIntent ? <header className="border-b border-[#e5e4da] bg-[#fffefb]"><div className="container mx-auto flex min-h-16 items-center justify-between px-4"><Link href={returnTo} className="text-sm font-bold text-[#596a32]">MAZIGHO · Projet boutique</Link><span className="text-xs font-semibold text-slate-500">Accès propriétaire</span></div></header> : <Header />}
      <main className="flex-1">
        <section className="py-12 md:py-16" style={{ background: independentSiteIntent ? "linear-gradient(135deg, #eef3e7, #ffffff)" : `linear-gradient(135deg, ${palette.soft}, #ffffff)` }}><div className="container mx-auto px-4"><Link href={independentSiteIntent ? returnTo : storeProjectIntent ? returnTo : "/"}><div className="mb-6 flex w-fit cursor-pointer items-center gap-2 font-medium" style={{ color: independentSiteIntent ? "#4d6632" : palette.accent }}><ArrowLeft className="h-5 w-5" /><span>{independentSiteIntent ? (returnTo.startsWith("/constructeur-sites/invitation/") ? "Retour à l’invitation du site" : "Retour à l’espace du site") : storeProjectIntent ? "Retour à mon projet de boutique" : copy.back}</span></div></Link><h1 className="mb-4 text-4xl font-bold text-gray-800 md:text-5xl">{independentSiteIntent ? "Créer votre accès au site" : storeProjectIntent ? "Créer mon accès propriétaire" : copy.register.title}</h1><p className="max-w-2xl text-lg text-gray-600">{independentSiteIntent ? "Créez vos identifiants avec l’adresse e-mail invitée pour gérer uniquement le site qui vous a été attribué." : storeProjectIntent ? "Cet accès sert à préparer et suivre votre projet de boutique MAZIGHO. Il ne vous inscrit pas au parcours d’achat de la boutique publique." : copy.register.lead}</p></div></section>
        <section className="py-14 md:py-20"><div className="container mx-auto max-w-md px-4"><Card><CardContent className="p-7 md:p-8"><div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: independentSiteIntent ? "#eef3e7" : palette.soft, color: independentSiteIntent ? "#4d6632" : palette.primary }}><UserPlus className="h-7 w-7" /></div><h2 className="text-center text-2xl font-semibold text-gray-800">{independentSiteIntent ? "Créer votre accès sécurisé" : copy.register.cardTitle}</h2><p className="mt-2 text-center text-sm text-gray-600">{independentSiteIntent ? "Cet accès sera strictement limité au site qui vous a été attribué." : copy.register.cardLead}</p>
          {independentSiteIntent && invitedEmailHint && (
            <div className="mt-4 rounded-xl border border-[#dfe7d0] bg-[#f7f9f4] p-3 text-xs text-slate-700" role="status">
              Important : utilisez l’adresse e-mail invitée <strong className="text-[#40552d]">{invitedEmailHint}</strong> afin que votre invitation puisse être validée.
            </div>
          )}
          <div className="mt-6 space-y-2.5">
            <Button
              type="button"
              variant="outline"
              disabled={googleLoading || register.isPending || firebaseLogin.isPending}
              onClick={handleGoogleSignIn}
              className="w-full border-slate-300 bg-white font-semibold text-slate-800 hover:bg-slate-50"
            >
              {googleLoading ? "Connexion Google en cours..." : "S’inscrire avec Google"}
            </Button>
          </div>
          <div className="my-5 flex items-center gap-3 text-xs text-slate-400">
            <div className="h-px flex-1 bg-slate-200" />
            <span>ou avec votre e-mail</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <form className="space-y-5" onSubmit={handleSubmit}><div className="space-y-2"><Label htmlFor="register-name">{copy.register.name}</Label><Input id="register-name" value={name} onChange={event => setName(event.target.value)} autoComplete="name" required minLength={2} /></div><div className="space-y-2"><Label htmlFor="register-email">{copy.email}</Label><Input id="register-email" type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" placeholder="vous@exemple.ch" required /></div><div className="space-y-2"><Label htmlFor="register-password">{copy.password}</Label><div className="relative"><Input id="register-password" type={showPassword ? "text" : "password"} value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required className="pr-11" /><button type="button" onClick={() => setShowPassword(value => !value)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-gray-500 hover:text-gray-800" aria-label={showPassword ? copy.hidePassword : copy.showPassword}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div><p className="text-xs text-gray-500">{copy.register.passwordHint}</p></div><div className="space-y-2"><Label htmlFor="register-confirmation">{copy.register.confirmPassword}</Label><Input id="register-confirmation" type={showPassword ? "text" : "password"} value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="new-password" minLength={8} required /></div><Button type="submit" disabled={register.isPending} className="w-full text-white" style={{ backgroundColor: independentSiteIntent ? "#4d6632" : palette.accent }}>{register.isPending ? copy.register.submitting : independentSiteIntent ? "Créer mon accès et revenir à l’invitation" : storeProjectIntent ? "Continuer mon projet de boutique" : copy.register.submit}</Button></form>
          <p className="mt-6 text-center text-sm text-gray-600">{copy.register.haveAccount} <Link href={loginHref} className="font-semibold underline-offset-2 hover:underline" style={{ color: independentSiteIntent ? "#4d6632" : palette.accent }}>{independentSiteIntent ? "Se connecter sur /connexion-administration" : copy.register.login}</Link></p></CardContent></Card><div className="mt-7 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-left"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-700" /><p className="text-sm text-green-900">{independentSiteIntent ? "Votre compte donne uniquement accès au site indépendant auquel vous avez été invité." : copy.register.security}</p></div></div></section>
      </main>
      {independentSiteIntent ? <footer className="border-t border-[#dfe7d0] bg-[#fbfcf8] px-4 py-5 text-center text-xs text-slate-500">Cet accès est strictement limité au site qui vous a été attribué.</footer> : storeProjectIntent ? <footer className="border-t border-[#e5e4da] bg-[#fffefb] px-4 py-5 text-center text-xs text-slate-500">Cet accès est réservé à la préparation de votre boutique MAZIGHO.</footer> : <Footer />}
    </div>
  );
}
