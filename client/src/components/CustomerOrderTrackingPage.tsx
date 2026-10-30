import { useState } from "react";
import { Search, Truck, CheckCircle2, Clock, Package, MapPin, ExternalLink, AlertCircle, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { TrackingEventType } from "@shared/shippingCarrier";

export default function CustomerOrderTrackingPage() {
  const [searchInput, setSearchInput] = useState("");
  const [activeTrackingNumber, setActiveTrackingNumber] = useState<string | null>(null);

  const trackingQuery = trpc.shippingCarrier.getPublicTrackingDetails.useQuery(
    { trackingNumber: activeTrackingNumber || "" },
    { enabled: Boolean(activeTrackingNumber) }
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setActiveTrackingNumber(searchInput.trim());
    }
  };

  const getStepActive = (currentStatus: TrackingEventType, step: TrackingEventType) => {
    const order: TrackingEventType[] = [
      "LABEL_CREATED",
      "PICKED_UP",
      "IN_TRANSIT",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
    ];
    const currentIndex = order.indexOf(currentStatus);
    const stepIndex = order.indexOf(step);
    return stepIndex <= currentIndex;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6 px-4">
      <Card className="border-slate-200 shadow-md">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl font-bold flex items-center justify-center gap-2 text-slate-900">
            <Truck className="w-6 h-6 text-indigo-600" />
            Suivi de Colis & Commande
          </CardTitle>
          <CardDescription className="text-xs text-slate-600">
            Entrez votre numéro de suivi (ex: Swiss Post, DHL, Colissimo, Yalidine) pour suivre votre colis en temps réel.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <Input
              placeholder="ex: 99.00.123456.12345678, JJD00030..., YAL-2026..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="text-xs bg-white"
              required
            />
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold gap-1.5 shrink-0"
            >
              <Search className="w-4 h-4" />
              Rechercher
            </Button>
          </form>

          {trackingQuery.isLoading && (
            <div className="py-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              Recherche des informations de livraison...
            </div>
          )}

          {trackingQuery.isError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>Numéro de suivi introuvable. Veuillez vérifier votre saisie.</span>
            </div>
          )}

          {trackingQuery.data && (
            <div className="space-y-6 pt-2">
              {/* Header Details */}
              <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] text-indigo-700 font-semibold block">N° de Suivi {trackingQuery.data.carrier}</span>
                  <span className="font-mono text-base font-black text-indigo-950">{trackingQuery.data.trackingNumber}</span>
                  <span className="text-xs text-slate-600 block mt-0.5">Commande #{trackingQuery.data.orderId}</span>
                </div>

                <a
                  href={trackingQuery.data.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-medium text-xs hover:bg-indigo-700 shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Site officiel {trackingQuery.data.carrier}
                </a>
              </div>

              {/* Steps Progress Timeline */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900">Progression de la Livraison</h4>
                <div className="grid grid-cols-5 gap-1 text-center py-2">
                  {[
                    { label: "Pris en charge", step: "PICKED_UP" },
                    { label: "Acheminement", step: "IN_TRANSIT" },
                    { label: "En livraison", step: "OUT_FOR_DELIVERY" },
                    { label: "Livré", step: "DELIVERED" },
                  ].map((s, idx) => {
                    const active = getStepActive(trackingQuery.data!.events[0]?.status, s.step as TrackingEventType);
                    return (
                      <div key={idx} className="space-y-1">
                        <div
                          className={`h-2 rounded-full ${
                            active ? "bg-indigo-600" : "bg-slate-200"
                          }`}
                        />
                        <span className={`text-[10px] block font-medium ${active ? "text-indigo-900 font-bold" : "text-slate-400"}`}>
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tracking Event Log */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900">Historique Détaillé</h4>
                <div className="space-y-3 relative border-l-2 border-indigo-100 pl-4 ml-2">
                  {trackingQuery.data.events.map((ev, i) => (
                    <div key={i} className="relative space-y-0.5">
                      <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-indigo-600 ring-4 ring-indigo-50" />
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{ev.description}</span>
                        <span className="text-[10px] text-slate-500">{new Date(ev.timestamp).toLocaleString()}</span>
                      </div>
                      {ev.location && (
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {ev.location}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
