import { useState } from "react";
import { useLocation } from "wouter";
import { Building2, ChevronDown, ChevronUp, Compass, LayoutDashboard, Mail, Rocket, ShoppingBag, Sparkles, Store } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

const SURFACES = [
  {
    id: "storefront",
    label: "Boutique MAZIGHO",
    domain: "mazigho.ch",
    path: "/",
    requiresAdmin: false,
    icon: Store,
  },
  {
    id: "pro",
    label: "Landing SaaS Pro",
    domain: "pro.mazigho.com",
    path: "/mazigho-saas",
    requiresAdmin: false,
    icon: Rocket,
  },
  {
    id: "turnkey",
    label: "Boutique Clé en main",
    domain: "mazigho.ch/creation-boutique",
    path: "/creation-boutique",
    requiresAdmin: false,
    icon: Sparkles,
  },
  {
    id: "studio",
    label: "MAZIGHO Studio",
    domain: "studio.mazigho.com",
    path: "/admin/studio",
    requiresAdmin: true,
    icon: Building2,
  },
  {
    id: "admin",
    label: "Admin Boutique",
    domain: "mazigho.ch/admin",
    path: "/admin",
    requiresAdmin: true,
    icon: LayoutDashboard,
  },
] as const;

export function MazighoSurfaceSwitcher() {
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);
  const [location, setLocation] = useLocation();
  const { user } = useAuth() as any;
  const ownedStoresQuery = trpc.auth.myOwnedStores.useQuery(undefined, { staleTime: 30_000, retry: false, enabled: Boolean(user) });
  const ownedStores = ownedStoresQuery.data ?? [];

  // Le sélecteur ne doit jamais être un registre public. Il ne présente que
  // les boutiques pour lesquelles le compte courant possède une membership
  // active owner/manager, fournie par le serveur.
  if (!user || (user.role !== "admin" && ownedStores.length === 0)) return null;
  const canSeePlatformSurfaces = user.role === "admin";

  const currentPath = location.split("?")[0];
  const activeSurface =
    currentPath.startsWith("/admin/studio")
      ? SURFACES[3]
      : currentPath.startsWith("/admin")
        ? SURFACES[4]
        : currentPath.startsWith("/creation-boutique")
          ? SURFACES[2]
          : currentPath === "/mazigho-saas"
            ? SURFACES[1]
            : SURFACES[0];

  const handleSelectSurface = (surface: (typeof SURFACES)[number]) => {
    setSwitching(surface.id);
    setLocation(surface.path);
    setOpen(false);
    setSwitching(null);
  };

  const handleSelectStore = (storeId: number) => {
    const selectedStore = ownedStores.find(store => store.id === storeId);
    if (!selectedStore) return;
    setSwitching(`store-${storeId}`);
    const currentHost = window.location.hostname.toLowerCase();
    const targetHost = selectedStore.primaryDomain.trim().toLowerCase();
    if (targetHost && targetHost !== currentHost) {
      window.location.assign(`https://${targetHost}/admin`);
    } else {
      setLocation("/admin");
    }
    setOpen(false);
  };

  return (
    <div
      className="fixed bottom-4 left-4 z-[90] font-sans"
      data-testid="mazigho-surface-switcher"
    >
      {open && (
        <div className="mb-2 w-80 max-h-[80vh] overflow-y-auto rounded-2xl border border-slate-700/80 bg-slate-950/95 p-3 text-white shadow-2xl backdrop-blur-md">
          <div className="mb-2 flex items-center justify-between border-b border-slate-800 pb-2 px-1">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-orange-400">
                Navigation multi-espaces
              </p>
              <p className="text-xs text-slate-300">
                Basculer d’un domaine ou d’une boutique à l’autre
              </p>
            </div>
          </div>
          <div className="space-y-1">
            {canSeePlatformSurfaces && <p className="px-2 pt-1 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Espaces plateforme
            </p>}
            {canSeePlatformSurfaces && SURFACES.map(surface => {
              const Icon = surface.icon;
              const isActive = activeSurface.id === surface.id;
              const isBusy = switching === surface.id;
              return (
                <button
                  key={surface.id}
                  type="button"
                  disabled={Boolean(switching)}
                  onClick={() => handleSelectSurface(surface)}
                  data-testid={`switch-surface-${surface.id}`}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                    isActive
                      ? "bg-orange-500 text-white shadow-sm"
                      : "text-slate-200 hover:bg-slate-800/90 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">
                      {isBusy ? "Ouverture en cours…" : surface.label}
                    </p>
                    <p
                      className={`truncate text-[10px] ${
                        isActive ? "text-orange-100" : "text-slate-400"
                      }`}
                    >
                      {surface.domain}
                    </p>
                  </div>
                </button>
              );
            })}

            {ownedStores.length > 0 && (
              <div className="pt-2 border-t border-slate-800 mt-2">
                <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Mes boutiques ({ownedStores.length})
                </p>
                <p className="mb-2 flex items-center gap-1.5 px-2 text-[10px] text-slate-400"><Mail className="h-3 w-3" />{user.email || "Compte connecté"}</p>
                {ownedStores.map(st => {
                  const isStoreActive = window.location.hostname.toLowerCase() === st.primaryDomain.trim().toLowerCase();
                  const isBusy = switching === `store-${st.id}`;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      disabled={Boolean(switching)}
                      onClick={() => handleSelectStore(st.id)}
                      data-testid={`switch-store-${st.id}`}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                        isStoreActive
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "text-slate-200 hover:bg-slate-800/90 hover:text-white"
                      }`}
                    >
                      <ShoppingBag className="h-4 w-4 shrink-0 text-emerald-400" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold">
                          {isBusy ? "Ouverture en cours…" : st.displayName}
                        </p>
                        <p className="truncate text-[10px] text-slate-400">
                          {st.primaryDomain}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        data-testid="mazigho-surface-switcher-toggle"
        className="inline-flex items-center gap-2.5 rounded-full border border-slate-700/80 bg-slate-950/95 px-4 py-2.5 text-xs font-semibold text-white shadow-xl backdrop-blur-md transition hover:bg-slate-900"
      >
        <Compass className="h-4 w-4 text-orange-400" />
        <span>Espace : {activeSurface.label}</span>
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        ) : (
          <ChevronUp className="h-3.5 w-3.5 text-slate-400" />
        )}
      </button>
    </div>
  );
}
