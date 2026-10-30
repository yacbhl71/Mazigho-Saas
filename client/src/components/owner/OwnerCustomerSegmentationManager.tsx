import { useState } from "react";
import { Users, Crown, RefreshCw, AlertCircle, Download, Save, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import type { SegmentTag } from "@shared/customerSegmentation";

export default function OwnerCustomerSegmentationManager() {
  const utils = trpc.useUtils();
  const segmentsQuery = trpc.customerSegmentation.getSegments.useQuery();

  const [activeFilter, setActiveFilter] = useState<SegmentTag | "ALL">("ALL");
  const [enabled, setEnabled] = useState(true);
  const [vipChf, setVipChf] = useState<number>(500);
  const [isInitialized, setIsInitialized] = useState(false);

  if (segmentsQuery.data && !isInitialized) {
    setEnabled(segmentsQuery.data.config.enabled);
    setVipChf((segmentsQuery.data.config.vipThresholdCents || 50000) / 100);
    setIsInitialized(true);
  }

  const saveConfigMutation = trpc.customerSegmentation.saveConfig.useMutation({
    onSuccess: () => {
      toast.success("Seuils de segmentation mis à jour !");
      utils.customerSegmentation.getSegments.invalidate();
    },
    onError: (err) => toast.error(err.message || "Erreur d'enregistrement."),
  });

  const getTagBadge = (tag: SegmentTag) => {
    switch (tag) {
      case "VIP":
        return <Badge className="bg-purple-600 text-white font-bold gap-1"><Crown className="w-3 h-3 text-amber-300" /> VIP</Badge>;
      case "RECURRING":
        return <Badge className="bg-blue-600 text-white font-bold gap-1"><RefreshCw className="w-3 h-3" /> Récurrent</Badge>;
      case "HIGH_AOV":
        return <Badge className="bg-emerald-600 text-white font-bold gap-1"><Sparkles className="w-3 h-3" /> Gros Panier</Badge>;
      case "NEW_CUSTOMER":
        return <Badge className="bg-indigo-600 text-white font-bold gap-1">Nouveau Client</Badge>;
      case "INACTIVE_60D":
        return <Badge variant="outline" className="bg-rose-50 text-rose-800 border-rose-200 gap-1"><AlertCircle className="w-3 h-3" /> Inactif (+60j)</Badge>;
    }
  };

  const customers = segmentsQuery.data?.customers || [];
  const filteredCustomers =
    activeFilter === "ALL"
      ? customers
      : customers.filter((c) => c.tags.includes(activeFilter));

  const exportSegmentCsv = () => {
    if (filteredCustomers.length === 0) return;
    const headers = "Nom,Email,Total Dépensé (CHF),Nombre Commandes,Dernière Commande,Tags\n";
    const rows = filteredCustomers
      .map(
        (c) =>
          `"${c.name}","${c.email}",${(c.totalSpentCents / 100).toFixed(2)},${c.ordersCount},"${new Date(c.lastOrderDate).toLocaleDateString()}","${c.tags.join(";")}"`
      )
      .join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `segment_clients_${activeFilter.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exportation CSV téléchargée !");
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Segmentation Clients & Tags Automatiques (Shopify Customer Segments)
            </CardTitle>
            <CardDescription>
              Segmentez automatiquement vos acheteurs (VIP, Clients récurrents, Gros paniers, Clients inactifs) pour vos relances ciblées.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs font-semibold">Segmentation Active</Label>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Threshold Configuration */}
        <div className="p-4 rounded-xl border border-purple-100 bg-purple-50/30 flex flex-col sm:flex-row items-end justify-between gap-4">
          <div className="w-full sm:w-auto space-y-1">
            <Label htmlFor="vip-thresh" className="text-xs font-semibold">Seuil du statut VIP (CHF dépensés)</Label>
            <Input
              id="vip-thresh"
              type="number"
              value={vipChf}
              onChange={(e) => setVipChf(parseFloat(e.target.value) || 0)}
              className="mt-1 bg-white text-xs w-full sm:w-48"
            />
          </div>

          <Button
            size="sm"
            onClick={() =>
              saveConfigMutation.mutate({
                enabled,
                vipThresholdCents: Math.round(vipChf * 100),
                highAovThresholdCents: 15000,
              })
            }
            disabled={saveConfigMutation.isPending}
            className="bg-purple-700 hover:bg-purple-800 text-white text-xs gap-1.5 shrink-0"
          >
            {saveConfigMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Enregistrer le Seuil VIP
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "ALL", label: "Tous les clients" },
              { id: "VIP", label: "👑 VIP" },
              { id: "RECURRING", label: "🔄 Récurrents" },
              { id: "HIGH_AOV", label: "✨ Gros Paniers" },
              { id: "INACTIVE_60D", label: "⚠️ Inactifs (+60j)" },
            ].map((tab) => (
              <Button
                key={tab.id}
                size="xs"
                variant={activeFilter === tab.id ? "default" : "outline"}
                onClick={() => setActiveFilter(tab.id as any)}
                className={activeFilter === tab.id ? "bg-purple-700 text-white text-xs" : "text-xs"}
              >
                {tab.label}
              </Button>
            ))}
          </div>

          <Button
            size="xs"
            variant="outline"
            onClick={exportSegmentCsv}
            disabled={filteredCustomers.length === 0}
            className="text-xs gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Exporter CSV ({filteredCustomers.length})
          </Button>
        </div>

        {/* Customer List */}
        {segmentsQuery.isLoading ? (
          <div className="py-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Calcul des segments clients...
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="py-8 text-center text-slate-500 space-y-2">
            <Users className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-medium">Aucun client dans ce segment.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredCustomers.map((cust) => (
              <div
                key={cust.userId}
                className="p-4 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{cust.name}</span>
                    <span className="text-xs text-slate-500">({cust.email})</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Total Dépensé : <strong className="text-purple-900 dark:text-purple-300">{(cust.totalSpentCents / 100).toFixed(2)} CHF</strong> ({cust.ordersCount} commande(s))
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {cust.tags.map((tag) => (
                    <span key={tag}>{getTagBadge(tag)}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
