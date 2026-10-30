import { useState } from "react";
import { Truck, Printer, Plus, Search, MapPin, Loader2, ExternalLink, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { CarrierCode, ShippingLabel, TrackingEventType } from "@shared/shippingCarrier";

export default function OwnerShippingLabelsManager() {
  const utils = trpc.useUtils();
  const labelsQuery = trpc.shippingCarrier.getStoreLabels.useQuery();
  const senderAddressQuery = trpc.shippingCarrier.getSenderAddress.useQuery();

  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [isAddressDialogOpen, setIsAddressDialogOpen] = useState(false);

  // Form states
  const [orderId, setOrderId] = useState("");
  const [carrier, setCarrier] = useState<CarrierCode>("SWISS_POST");
  const [recipientName, setRecipientName] = useState("");
  const [recipientStreet, setRecipientStreet] = useState("");
  const [recipientPostalCode, setRecipientPostalCode] = useState("");
  const [recipientCity, setRecipientCity] = useState("");
  const [recipientCountry, setRecipientCountry] = useState("CH");
  const [weightKg, setWeightKg] = useState<number>(0.5);

  // Update tracking status state
  const [selectedLabel, setSelectedLabel] = useState<ShippingLabel | null>(null);
  const [newStatus, setNewStatus] = useState<TrackingEventType>("IN_TRANSIT");
  const [statusDesc, setStatusDesc] = useState("");
  const [statusLoc, setStatusLoc] = useState("");

  const generateMutation = trpc.shippingCarrier.generateLabel.useMutation({
    onSuccess: (label) => {
      toast.success(`Étiquette générée avec succès ! Suivi: ${label.trackingNumber}`);
      setIsNewDialogOpen(false);
      utils.shippingCarrier.getStoreLabels.invalidate();
      openPrintWindow(label.trackingNumber);
    },
    onError: (err) => toast.error(err.message || "Erreur de génération d'étiquette."),
  });

  const updateStatusMutation = trpc.shippingCarrier.updateTrackingEvent.useMutation({
    onSuccess: () => {
      toast.success("Événement de suivi ajouté !");
      setSelectedLabel(null);
      utils.shippingCarrier.getStoreLabels.invalidate();
    },
    onError: (err) => toast.error(err.message || "Erreur de mise à jour."),
  });

  const openPrintWindow = async (trackingNumber: string) => {
    try {
      const res = await utils.shippingCarrier.getLabelHtml.fetch({ trackingNumber });
      const printWindow = window.open("", "_blank", "width=800,height=600");
      if (printWindow) {
        printWindow.document.write(res);
        printWindow.document.close();
      } else {
        toast.error("Veuillez autoriser les fenêtres surgissantes pour imprimer l'étiquette.");
      }
    } catch (err: any) {
      toast.error(err.message || "Impossible de charger le document d'impression.");
    }
  };

  const getCarrierBadge = (c: CarrierCode) => {
    switch (c) {
      case "SWISS_POST":
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-bold">Swiss Post 🇨🇭</Badge>;
      case "DHL_EXPRESS":
        return <Badge className="bg-yellow-500 hover:bg-yellow-600 text-slate-950 font-bold">DHL Express 🟡</Badge>;
      case "COLISSIMO":
        return <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-bold">Colissimo 🇫🇷</Badge>;
      case "YALIDINE":
        return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">Yalidine 🇩🇿</Badge>;
      case "FEDEX":
        return <Badge className="bg-purple-600 hover:bg-purple-700 text-white font-bold">FedEx 🟣</Badge>;
    }
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-600" />
              Expédition Multi-Transporteurs & Étiquettes
            </CardTitle>
            <CardDescription>
              Générez des étiquettes de livraison certifiées (Swiss Post, DHL, Colissimo, Yalidine) au format thermique 10x15cm.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddressDialogOpen(true)}
              className="text-xs gap-1.5"
            >
              <MapPin className="w-3.5 h-3.5 text-indigo-600" />
              Adresse Expéditeur
            </Button>
            <Button
              size="sm"
              onClick={() => setIsNewDialogOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Créer une Étiquette
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {labelsQuery.isLoading ? (
          <div className="py-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            Chargement des étiquettes d'expédition...
          </div>
        ) : !labelsQuery.data || labelsQuery.data.length === 0 ? (
          <div className="py-8 text-center text-slate-500 space-y-2">
            <Truck className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-medium">Aucune étiquette d'expédition générée pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {labelsQuery.data.map((lbl) => (
              <div
                key={lbl.id}
                className="p-4 rounded-xl border border-slate-200 bg-white dark:bg-slate-900 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {getCarrierBadge(lbl.carrier)}
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                      {lbl.trackingNumber}
                    </span>
                    <span className="text-xs text-slate-500">• Commande #{lbl.orderId}</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    Destinataire : <strong>{lbl.recipientAddress.name}</strong> ({lbl.recipientAddress.postalCode} {lbl.recipientAddress.city}, {lbl.recipientAddress.country})
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Poids: {lbl.weightKg} kg | Créé le: {new Date(lbl.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openPrintWindow(lbl.trackingNumber)}
                    className="text-xs gap-1.5"
                  >
                    <Printer className="w-3.5 h-3.5 text-slate-600" />
                    Imprimer PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedLabel(lbl)}
                    className="text-xs gap-1 text-indigo-600 hover:text-indigo-800"
                  >
                    Suivi (+ Statut)
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal de création d'étiquette */}
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Truck className="w-4 h-4 text-indigo-600" />
                Générer une Étiquette d'Expédition
              </DialogTitle>
            </DialogHeader>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                generateMutation.mutate({
                  orderId,
                  carrier,
                  recipientName,
                  recipientStreet,
                  recipientPostalCode,
                  recipientCity,
                  recipientCountry,
                  weightKg,
                });
              }}
              className="space-y-3 py-2 text-xs"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="lbl-order" className="text-xs font-semibold">N° Commande</Label>
                  <Input
                    id="lbl-order"
                    placeholder="ex: CMD-1082"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    className="mt-1 text-xs"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Transporteur</Label>
                  <Select value={carrier} onValueChange={(v) => setCarrier(v as CarrierCode)}>
                    <SelectTrigger className="mt-1 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SWISS_POST">Swiss Post (Suisse 🇨🇭)</SelectItem>
                      <SelectItem value="DHL_EXPRESS">DHL Express (Monde 🌍)</SelectItem>
                      <SelectItem value="COLISSIMO">Colissimo (France/Europe 🇫🇷)</SelectItem>
                      <SelectItem value="YALIDINE">Yalidine Express (Algérie 🇩🇿)</SelectItem>
                      <SelectItem value="FEDEX">FedEx Express</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="rec-name" className="text-xs font-semibold">Nom du Destinataire</Label>
                <Input
                  id="rec-name"
                  placeholder="ex: Marie Dubois"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="mt-1 text-xs"
                  required
                />
              </div>

              <div>
                <Label htmlFor="rec-street" className="text-xs font-semibold">Adresse de Livraison</Label>
                <Input
                  id="rec-street"
                  placeholder="ex: Avenue de la Gare 14"
                  value={recipientStreet}
                  onChange={(e) => setRecipientStreet(e.target.value)}
                  className="mt-1 text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="rec-npa" className="text-xs font-semibold">NPA / CP</Label>
                  <Input
                    id="rec-npa"
                    placeholder="1003"
                    value={recipientPostalCode}
                    onChange={(e) => setRecipientPostalCode(e.target.value)}
                    className="mt-1 text-xs"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="rec-city" className="text-xs font-semibold">Ville</Label>
                  <Input
                    id="rec-city"
                    placeholder="Lausanne"
                    value={recipientCity}
                    onChange={(e) => setRecipientCity(e.target.value)}
                    className="mt-1 text-xs"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="rec-country" className="text-xs font-semibold">Pays</Label>
                  <Input
                    id="rec-country"
                    placeholder="CH"
                    value={recipientCountry}
                    onChange={(e) => setRecipientCountry(e.target.value)}
                    className="mt-1 text-xs"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="lbl-weight" className="text-xs font-semibold">Poids estimé (kg)</Label>
                <Input
                  id="lbl-weight"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={weightKg}
                  onChange={(e) => setWeightKg(parseFloat(e.target.value) || 0.5)}
                  className="mt-1 text-xs"
                  required
                />
              </div>

              <DialogFooter className="pt-2">
                <Button variant="ghost" type="button" onClick={() => setIsNewDialogOpen(false)} className="text-xs">
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={generateMutation.isPending}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
                >
                  {generateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
                  Générer & Imprimer L'Étiquette
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal de Mise à jour d'événement de suivi */}
        <Dialog open={Boolean(selectedLabel)} onOpenChange={(open) => !open && setSelectedLabel(null)}>
          {selectedLabel && (
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <Truck className="w-4 h-4 text-indigo-600" />
                  Mettre à jour le Suivi #{selectedLabel.trackingNumber}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-3 py-2 text-xs">
                <div>
                  <Label className="text-xs font-semibold">Nouveau Statut</Label>
                  <Select value={newStatus} onValueChange={(v) => setNewStatus(v as TrackingEventType)}>
                    <SelectTrigger className="mt-1 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LABEL_CREATED">Étiquette Créée</SelectItem>
                      <SelectItem value="PICKED_UP">Pris en charge par le transporteur</SelectItem>
                      <SelectItem value="IN_TRANSIT">En cours d'acheminement</SelectItem>
                      <SelectItem value="OUT_FOR_DELIVERY">En cours de livraison finale</SelectItem>
                      <SelectItem value="DELIVERED">Colis Livré</SelectItem>
                      <SelectItem value="EXCEPTION">Anomalie / Retard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status-desc" className="text-xs font-semibold">Description de l'étape</Label>
                  <Input
                    id="status-desc"
                    placeholder="ex: Colis arrivé au centre de tri régional"
                    value={statusDesc}
                    onChange={(e) => setStatusDesc(e.target.value)}
                    className="mt-1 text-xs"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="status-loc" className="text-xs font-semibold">Localisation (optionnel)</Label>
                  <Input
                    id="status-loc"
                    placeholder="ex: Genève Hub 12"
                    value={statusLoc}
                    onChange={(e) => setStatusLoc(e.target.value)}
                    className="mt-1 text-xs"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <span className="font-semibold text-slate-800">Historique des étapes :</span>
                  {selectedLabel.events.map((ev, i) => (
                    <div key={i} className="text-[11px] text-slate-600 flex justify-between">
                      <span>• {ev.status} : {ev.description}</span>
                      <span className="text-slate-400">{new Date(ev.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button variant="ghost" onClick={() => setSelectedLabel(null)} className="text-xs">
                  Fermer
                </Button>
                <Button
                  disabled={updateStatusMutation.isPending || !statusDesc}
                  onClick={() => {
                    updateStatusMutation.mutate({
                      trackingNumber: selectedLabel.trackingNumber,
                      status: newStatus,
                      description: statusDesc,
                      location: statusLoc,
                    });
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs gap-1.5"
                >
                  {updateStatusMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Ajouter l'Événement de Suivi
                </Button>
              </DialogFooter>
            </DialogContent>
          )}
        </Dialog>
      </CardContent>
    </Card>
  );
}
