import { useState } from "react";
import { Link } from "wouter";
import { UserRound } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/** Checkout without an account: name + e-mail open a short customer session for this order. */
export default function CheckoutGuestAccess() {
  const utils = trpc.useUtils();
  const me = trpc.auth.me.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [conflict, setConflict] = useState<string | null>(null);
  const start = trpc.auth.startGuestCheckout.useMutation({
    onSuccess: async data => {
      if (data.sessionToken) window.localStorage.setItem("mazigho_session_token", data.sessionToken);
      await utils.auth.me.invalidate();
      toast.success("Vous pouvez finaliser votre commande sans compte.");
    },
    onError: error => {
      if (error.data?.code === "CONFLICT") setConflict(error.message);
      else toast.error(error.message);
    },
  });
  const reset = trpc.auth.requestPasswordReset.useMutation({
    onSuccess: data => toast.success(data.emailAvailable ? "Si cette adresse est connue, un lien vient d’être envoyé." : "L’envoi d’e-mails n’est pas disponible pour le moment."),
    onError: error => toast.error(error.message),
  });
  if (me.isLoading || me.data) return null;
  const ready = name.trim().length >= 2 && /^\S+@\S+\.\S+$/.test(email.trim());

  return <div className="space-y-3 rounded-xl border border-sky-200 bg-sky-50/60 p-3" data-testid="checkout-guest-access">
    <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-sky-900"><UserRound className="h-4 w-4" /> Commander sans compte</p>
    <div className="grid gap-2 sm:grid-cols-2">
      <Input value={name} onChange={event => { setName(event.target.value); setConflict(null); }} placeholder="Nom complet" autoComplete="name" className="h-10 bg-white" data-testid="checkout-guest-name" />
      <Input value={email} onChange={event => { setEmail(event.target.value); setConflict(null); }} placeholder="E-mail" type="email" autoComplete="email" className="h-10 bg-white" data-testid="checkout-guest-email" />
    </div>
    {conflict && <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-950" data-testid="checkout-guest-conflict">
      <p>{conflict}</p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="outline" className="h-8 bg-white" disabled={reset.isPending} onClick={() => reset.mutate({ email: email.trim() })} data-testid="checkout-guest-reset">Recevoir le lien</Button>
        <Button type="button" size="sm" variant="outline" className="h-8 bg-white" asChild><Link href="/login" data-testid="checkout-guest-login">Se connecter</Link></Button>
      </div>
    </div>}
    <Button type="button" className="h-10 w-full bg-sky-700 text-white hover:bg-sky-800" disabled={!ready || start.isPending} onClick={() => start.mutate({ name: name.trim(), email: email.trim() })} data-testid="checkout-guest-submit">{start.isPending ? "Préparation…" : "Continuer sans compte"}</Button>
    <p className="text-xs leading-5 text-slate-600">Vous recevrez le suivi de commande à cette adresse. <Link href="/login" className="font-semibold underline underline-offset-2">J’ai déjà un compte</Link></p>
  </div>;
}
