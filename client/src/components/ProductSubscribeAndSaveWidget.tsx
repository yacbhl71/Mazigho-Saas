import { useState } from "react";
import { RefreshCw, CheckCircle2, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SubscriptionFrequency } from "@shared/productSubscriptions";

interface ProductSubscribeAndSaveWidgetProps {
  productId: number;
  productTitle: string;
  priceCents: number;
}

export default function ProductSubscribeAndSaveWidget({
  productId,
  productTitle,
  priceCents,
}: ProductSubscribeAndSaveWidgetProps) {
  const utils = trpc.useUtils();
  const configQuery = trpc.productSubscriptions.getConfig.useQuery();
  const config = configQuery.data;

  const [purchaseType, setPurchaseType] = useState<"ONCE" | "SUBSCRIBE">("ONCE");
  const [frequency, setFrequency] = useState<SubscriptionFrequency>("1_MONTH");

  const createSubMutation = trpc.productSubscriptions.createSubscription.useMutation({
    onSuccess: (res) => {
      toast.success(`Abonnement activé ! Prochaine livraison prévue le ${new Date(res.nextDeliveryDate).toLocaleDateString()}`);
      utils.productSubscriptions.getMySubscriptions.invalidate();
    },
    onError: (err) => toast.error(err.message || "Erreur lors de la souscription."),
  });

  if (!config || !config.enabled) {
    return null;
  }

  const discountPct = config.defaultDiscountPercentage || 10;
  const originalPriceChf = priceCents / 100;
  const discountedPriceChf = (priceCents * (1 - discountPct / 100)) / 100;

  return (
    <div className="p-4 rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/40 via-white to-indigo-50/10 space-y-3 my-4">
      <RadioGroup
        value={purchaseType}
        onValueChange={(val) => setPurchaseType(val as any)}
        className="space-y-2"
      >
        {/* Option 1: One-time purchase */}
        <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="ONCE" id="opt-once" />
            <Label htmlFor="opt-once" className="text-xs font-semibold cursor-pointer">
              Achat Unique
            </Label>
          </div>
          <span className="font-bold text-xs text-slate-900">{originalPriceChf.toFixed(2)} CHF</span>
        </div>

        {/* Option 2: Subscribe & Save */}
        <div className="p-2.5 rounded-lg border border-indigo-300 bg-indigo-50/50 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RadioGroupItem value="SUBSCRIBE" id="opt-sub" />
              <Label htmlFor="opt-sub" className="text-xs font-bold cursor-pointer text-indigo-950 flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5 text-indigo-600" />
                S'abonner & Économiser {discountPct}%
              </Label>
            </div>
            <span className="font-black text-sm text-indigo-700">{discountedPriceChf.toFixed(2)} CHF</span>
          </div>

          {purchaseType === "SUBSCRIBE" && (
            <div className="pt-2 space-y-2 text-xs border-t border-indigo-100">
              <Label className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-indigo-600" /> Fréquence de livraison automatique :
              </Label>
              <Select value={frequency} onValueChange={(v) => setFrequency(v as SubscriptionFrequency)}>
                <SelectTrigger className="bg-white text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2_WEEKS">Toutes les 2 semaines</SelectItem>
                  <SelectItem value="1_MONTH">Tous les mois (Recommandé)</SelectItem>
                  <SelectItem value="2_MONTHS">Tous les 2 mois</SelectItem>
                  <SelectItem value="3_MONTHS">Tous les 3 mois</SelectItem>
                </SelectContent>
              </Select>

              <Button
                size="sm"
                disabled={createSubMutation.isPending}
                onClick={() => {
                  createSubMutation.mutate({
                    productId,
                    productTitle,
                    priceCents,
                    frequency,
                  });
                }}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs gap-1.5 mt-2"
              >
                {createSubMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Activer l'Abonnement Récurrent
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </RadioGroup>
    </div>
  );
}
