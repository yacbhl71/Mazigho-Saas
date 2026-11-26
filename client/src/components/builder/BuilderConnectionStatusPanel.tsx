import { SHARED_BUILDER_CONNECTION_STATES, getSharedBuilderConnectionSummary } from "@shared/builderConnectionStates";

export function BuilderConnectionStatusPanel() {
  const summary = getSharedBuilderConnectionSummary();

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 shadow-xs" data-testid="builder-connection-status-panel" aria-labelledby="builder-connection-status-title">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 id="builder-connection-status-title" className="text-xs font-bold text-slate-950">Connexions de services</h2>
          <p className="mt-1 text-[11px] leading-5 text-slate-600">Les blocs restent éditables et visuels. Aucune donnée métier réelle n’est activée dans ce constructeur.</p>
        </div>
        <span className="shrink-0 rounded-md bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700">{summary.total} interfaces</span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5 text-[10px]">
        <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 font-semibold text-amber-900">À configurer · {summary.toConfigure}</span>
        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-semibold text-slate-700">Non connecté · {summary.notConnected}</span>
      </div>
      <div className="mt-3 space-y-1.5">
        {SHARED_BUILDER_CONNECTION_STATES.map((state) => (
          <div key={state.id} className="flex items-start justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50/70 px-2.5 py-2">
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-slate-800">{state.label}</p>
              <p className="mt-0.5 text-[10px] leading-4 text-slate-500">{state.description}</p>
            </div>
            <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold ${state.status === "Non connecté" ? "bg-slate-200 text-slate-700" : "bg-amber-100 text-amber-900"}`}>{state.status}</span>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[10px] leading-4 text-slate-500">La connexion réelle sera traitée séparément avec les permissions et la validation appropriées.</p>
    </section>
  );
}
