import { useState } from "react";
import { Coins, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import type { SupportedCurrency } from "@shared/currencyConverter";

export default function OwnerCurrencyConverterSettings() {
  const utils = trpc.useUtils();
  const configQuery = trpc.currencyConverter.getConfig.useQuery();

  const [enabled, setEnabled] = useState(true);
  const [selectedCurrencies, setSelectedCurrencies] = useState<SupportedCurrency[]>(["CHF", "EUR", "USD", "DZD"]);
  const [isInitialized, setIsInitialized] = useState(false);

  if (configQuery.data && !isInitialized) {
    setEnabled(configQuery.data.enabled ?? true);
    setSelectedCurrencies(configQuery.data.supportedCurrencies || ["CHF", "EUR", "USD", "DZD"]);
    setIsInitialized(true);
  }

  const saveMutation = trpc.currencyConverter.saveConfig.useMutation({
    onSuccess: () => {
      toast.success("Sélecteur multi-devises mis à jour !");
      utils.currencyConverter.getConfig.invalidate();
    },
    onError: (err) => toast.error(err.message || "Erreur de sauvegarde."),
  });

  const allCurrencies: { code: SupportedCurrency; name: string; flag: string }[] = [
    { code: "CHF", name: "Franc Suisse (CHF)", flag: "🇨🇭" },
    { code: "EUR", name: "Euro (EUR)", flag: "🇪🇺" },
    { code: "USD", name: "Dollar US (USD)", flag: "🇺🇸" },
    { code: "DZD", name: "Dinar Algérien (DZD)", flag: "🇩🇿" },
    { code: "GBP", name: "Livre Sterling (GBP)", flag: "🇬🇧" },
    { code: "CAD", name: "Dollar Canadien (CAD)", flag: "🇨🇦" },
  ];

  const toggleCurrency = (code: SupportedCurrency) => {
    if (selectedCurrencies.includes(code)) {
      if (selectedCurrencies.length === 1) {
        toast.error("Vous devez conserver au moins une devise active.");
        return;
      }
      setSelectedCurrencies(selectedCurrencies.filter((c) => c !== code));
    } else {
      setSelectedCurrencies([...selectedCurrencies, code]);
    }
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Coins className="w-5 h-5 text-amber-500" />
              Sélecteur Multi-Devises Dynamique ("Shopify Currency Converter")
            </CardTitle>
            <CardDescription>
              Permettez aux acheteurs internationaux de convertir en temps réel les prix de votre boutique dans leur devise locale.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs font-semibold">Convertisseur Actif</Label>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label className="text-xs font-bold text-slate-900 dark:text-slate-100">
            Devises autorisées au survol du Header :
          </Label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allCurrencies.map((c) => (
              <div
                key={c.code}
                onClick={() => toggleCurrency(c.code)}
                className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                  selectedCurrencies.includes(c.code)
                    ? "border-amber-400 bg-amber-50/40 dark:bg-amber-950/20"
                    : "border-slate-200 bg-white dark:bg-slate-900"
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-bold">
                  <span>{c.flag}</span>
                  <span>{c.name}</span>
                </div>
                <Checkbox checked={selectedCurrencies.includes(c.code)} />
              </div>
            ))}
          </div>
        </div>

        <Button
          className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold py-4 text-xs gap-2"
          disabled={saveMutation.isPending}
          onClick={() => {
            saveMutation.mutate({
              enabled,
              baseCurrency: "CHF",
              supportedCurrencies: selectedCurrencies,
            });
          }}
        >
          {saveMutation.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Save className="w-4 h-4" />
              Enregistrer les Devises
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
