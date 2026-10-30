import { useState } from "react";
import { Tag, Plus, Trash2, Power, Save, Percent, Gift, Ticket, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { DiscountType } from "@shared/advancedDiscounts";

export default function OwnerAdvancedDiscountsManager() {
  const utils = trpc.useUtils();
  const rulesQuery = trpc.advancedDiscounts.getRules.useQuery();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<DiscountType>("AUTOMATIC_TIER");
  const [minSubtotalChf, setMinSubtotalChf] = useState<number>(100);
  const [discountPercentage, setDiscountPercentage] = useState<number>(10);
  const [discountFixedChf, setDiscountFixedChf] = useState<number>(0);
  const [buyProductId, setBuyProductId] = useState<number>(1);
  const [buyQuantity, setBuyQuantity] = useState<number>(2);
  const [getDiscountPercentage, setGetDiscountPercentage] = useState<number>(100);
  const [code, setCode] = useState("");
  const [usageLimit, setUsageLimit] = useState<number>(50);

  const saveMutation = trpc.advancedDiscounts.saveRule.useMutation({
    onSuccess: () => {
      toast.success("Règle de remise enregistrée avec succès !");
      setIsDialogOpen(false);
      utils.advancedDiscounts.getRules.invalidate();
      // Reset form
      setTitle("");
      setCode("");
    },
    onError: (err) => toast.error(err.message || "Erreur lors de l'enregistrement."),
  });

  const toggleMutation = trpc.advancedDiscounts.toggleRule.useMutation({
    onSuccess: () => {
      toast.success("Statut de la règle modifié.");
      utils.advancedDiscounts.getRules.invalidate();
    },
    onError: (err) => toast.error(err.message || "Impossible de modifier le statut."),
  });

  const deleteMutation = trpc.advancedDiscounts.deleteRule.useMutation({
    onSuccess: () => {
      toast.success("Règle supprimée.");
      utils.advancedDiscounts.getRules.invalidate();
    },
    onError: (err) => toast.error(err.message || "Erreur de suppression."),
  });

  const getTypeBadge = (t: DiscountType) => {
    switch (t) {
      case "AUTOMATIC_TIER":
        return <Badge className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1"><Percent className="w-3 h-3" /> Palier Automatique</Badge>;
      case "BUY_X_GET_Y":
        return <Badge className="bg-purple-600 hover:bg-purple-700 text-white gap-1"><Gift className="w-3 h-3" /> BOGO (Buy X Get Y)</Badge>;
      case "PROMO_CODE":
        return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1"><Ticket className="w-3 h-3" /> Code Promo Exclusif</Badge>;
    }
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Tag className="w-5 h-5 text-indigo-600" />
              Moteur de Remises Automatiques & Ventes Croisées (Shopify Discounts)
            </CardTitle>
            <CardDescription>
              Créez des règles de remises dynamiques (palier automatique, offres BOGO, codes promo). Activables/désactivables à tout moment.
            </CardDescription>
          </div>
          <Button
            size="sm"
            onClick={() => setIsDialogOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Créer une Règle de Remise
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {rulesQuery.isLoading ? (
          <div className="py-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Chargement des règles de remises...
          </div>
        ) : !rulesQuery.data || rulesQuery.data.length === 0 ? (
          <div className="py-8 text-center text-slate-500 space-y-2">
            <Tag className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-medium">Aucune règle de remise configurée pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rulesQuery.data.map((rule) => (
              <div
                key={rule.id}
                className="p-4 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 shadow-2xs flex items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getTypeBadge(rule.type)}
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{rule.title}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {rule.type === "AUTOMATIC_TIER" && `Dès ${((rule.minSubtotalCents || 0) / 100).toFixed(2)} CHF d'achat ➔ -${rule.discountPercentage ? `${rule.discountPercentage}%` : `${((rule.discountFixedCents || 0) / 100).toFixed(2)} CHF`}`}
                    {rule.type === "BUY_X_GET_Y" && `Achetez ${rule.buyQuantity} x Produit #${rule.buyProductId} ➔ Obtenez le suivant à -${rule.getDiscountPercentage || 100}%`}
                    {rule.type === "PROMO_CODE" && `Code: ${rule.code} (-${rule.discountPercentage || 0}%) | Utilisations: ${rule.timesUsed || 0} / ${rule.usageLimit || "Illimité"}`}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-600">{rule.enabled ? "Actif" : "Inactif"}</span>
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({ ruleId: rule.id, enabled: checked })
                      }
                    />
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate({ ruleId: rule.id })}
                    className="h-8 w-8 text-rose-600 hover:text-rose-800 hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de création de règle */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Tag className="w-4 h-4 text-indigo-600" />
                Nouvelle Règle de Remise
              </DialogTitle>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveMutation.mutate({
                  title,
                  type,
                  enabled: true,
                  minSubtotalCents: Math.round(minSubtotalChf * 100),
                  discountPercentage,
                  discountFixedCents: Math.round(discountFixedChf * 100),
                  buyProductId,
                  buyQuantity,
                  getDiscountPercentage,
                  code,
                  usageLimit,
                });
              }}
              className="space-y-3 py-2 text-xs"
            >
              <div>
                <Label htmlFor="rule-title" className="text-xs font-semibold">Titre de la promotion</Label>
                <Input
                  id="rule-title"
                  placeholder="ex: Offre Printemps -10% dès 100 CHF"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 text-xs"
                  required
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Type de Remise</Label>
                <Select value={type} onValueChange={(v) => setType(v as DiscountType)}>
                  <SelectTrigger className="mt-1 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AUTOMATIC_TIER">Remise Automatique au Panier (Seuil CHF)</SelectItem>
                    <SelectItem value="BUY_X_GET_Y">Achetez X, Obtenez Y (BOGO / Vente croisée)</SelectItem>
                    <SelectItem value="PROMO_CODE">Code Promo à Saisir au Checkout</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {type === "AUTOMATIC_TIER" && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <Label htmlFor="min-subtotal" className="text-xs font-semibold">Seuil Minimum (CHF)</Label>
                    <Input
                      id="min-subtotal"
                      type="number"
                      value={minSubtotalChf}
                      onChange={(e) => setMinSubtotalChf(parseFloat(e.target.value) || 0)}
                      className="mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="disc-pct" className="text-xs font-semibold">Remise (%)</Label>
                    <Input
                      id="disc-pct"
                      type="number"
                      value={discountPercentage}
                      onChange={(e) => setDiscountPercentage(parseFloat(e.target.value) || 0)}
                      className="mt-1 text-xs"
                    />
                  </div>
                </div>
              )}

              {type === "BUY_X_GET_Y" && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <Label htmlFor="buy-qty" className="text-xs font-semibold">Quantité à acheter (X)</Label>
                    <Input
                      id="buy-qty"
                      type="number"
                      value={buyQuantity}
                      onChange={(e) => setBuyQuantity(parseInt(e.target.value, 10) || 1)}
                      className="mt-1 text-xs"
                    />
                  </div>
                  <div>
                    <Label htmlFor="get-pct" className="text-xs font-semibold">Réduction sur l'article bonus (%)</Label>
                    <Input
                      id="get-pct"
                      type="number"
                      value={getDiscountPercentage}
                      onChange={(e) => setGetDiscountPercentage(parseFloat(e.target.value) || 100)}
                      className="mt-1 text-xs"
                    />
                  </div>
                </div>
              )}

              {type === "PROMO_CODE" && (
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <Label htmlFor="code-str" className="text-xs font-semibold">Code Promo</Label>
                    <Input
                      id="code-str"
                      placeholder="SPRING20"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="mt-1 text-xs uppercase"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="usage-lim" className="text-xs font-semibold">Limite d'utilisations</Label>
                    <Input
                      id="usage-lim"
                      type="number"
                      value={usageLimit}
                      onChange={(e) => setUsageLimit(parseInt(e.target.value, 10) || 50)}
                      className="mt-1 text-xs"
                    />
                  </div>
                </div>
              )}

              <DialogFooter className="pt-2">
                <Button variant="ghost" type="button" onClick={() => setIsDialogOpen(false)} className="text-xs">
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
                >
                  {saveMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Créer la Règle
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
