# Rapport d'Audit Technique — Analytics du Constructeur Indépendant MAZIGHO

**Date** : 22 novembre 2026  
**Projet** : `mazigho-independent-sites`  
**Domaine de production** : `https://mazigho-independent-sites-187ea4sfv-mazigho.vercel.app`  
**Branche d'audit dédiée** : `audit/independent-site-analytics-investigation`  
**Commit de référence main** : `1e7930771288eaa7724d000ae55414e957632c8c`  

---

## 1. Contexte et Symptôme Observé en Production

Lors du contrôle live sur le déploiement de production Vercel :
1. La vitrine publique du site indépendant (ex: `association-familiale-ath-vahloul`) est visitée dans le navigateur.
2. L'appel réseau `independentSiteBuilder.recordPageView` est effectivement émis par le client.
3. Les logs Vercel confirment que la requête HTTP `POST /api/trpc/independentSiteBuilder.recordPageView` répond avec un code **HTTP 200 OK**.
4. Pourtant, lorsque l'administrateur se connecte et consulte l'onglet **Statistiques** de son site, l'interface affiche invariablement :
   - **Visiteurs — 30 jours** : `0`
   - **Pages vues** : `0`
   - **Formulaires reçus** : `0`
   - **Pages les plus consultées** : « Aucune visite enregistrée pour le moment. »

---

## 2. Analyse Méthodique des 10 Points d'Inspection

### Point 1 : Payload exact envoyé par `recordPageView`
Dans `client/src/pages/site-builder/IndependentSitePublicPreviewPage.tsx` (lignes 125–144) :
```typescript
const pageViewKey = `${site.slug}:${activePage.slug || "/"}`;
if (trackedPageViewRef.current === pageViewKey) return;
...
recordPageViewMutation.mutate({ slug: site.slug, visitorKey, path: activePage.slug || "/" });
```
- **Payload client** :
  - `slug` : string valide (ex : `"association-familiale-ath-vahloul"`)
  - `visitorKey` : chaîne hexadécimale de 32 caractères générée par `window.crypto.getRandomValues()` et stockée dans `sessionStorage`
  - `path` : chemin de la page active (ex : `"/"`, `"/contact"`)
- **Schéma serveur** (`server/isolatedSiteBuilderRouter.ts` L.217) :
  ```typescript
  slug: z.string().trim().min(1).max(120),
  visitorKey: z.string().regex(/^[a-f0-9]{16,64}$/i),
  path: z.string().trim().max(240).default("/"),
  ```
- **Diagnostic Point 1** : Le payload est **parfaitement conforme** au schéma Zod. Aucune erreur de validation de type ne bloque la requête.

---

### Point 2 : Validation du `siteId`, du `slug`, du chemin et de la clé de session
Dans `server/isolatedSiteBuilderRouter.ts` (lignes 221–225) :
```typescript
recordPageView: publicProcedure.input(...).mutation(async ({ input }) => {
  const site = await getPublicIndependentSiteBySlug(input.slug, { allowDraftForOwnerUserId: undefined });
  if (!site) return { recorded: false } as const;
  return recordIndependentSitePageView({ siteId: site.id, visitorKey: input.visitorKey, path: input.path });
}),
```
- **Constat critique** : Pour obtenir le `siteId`, le routeur appelle la fonction `getPublicIndependentSiteBySlug(input.slug, { allowDraftForOwnerUserId: undefined })`.
- Or, cette fonction est conçue pour **délivrer le contenu public d'un site publié**.
- Si le site est au statut `"draft"` (ce qui est le cas d'ATH VAHLOUL ou de tout site en cours d'administration non encore manuellement publié avec son snapshot), `getPublicIndependentSiteBySlug` renvoie **`null`** !
- Par conséquent, la condition `if (!site) return { recorded: false }` s'active :
  - Le `siteId` n'est **jamais résolu**.
  - `recordIndependentSitePageView` n'est **jamais appelée**.

---

### Point 3 : Connexion à la base en environnement Vercel Serverless
Dans `server/db.ts` (lignes 7344–7370) :
- `getDb()` initialise le pool MySQL si `process.env.DATABASE_URL` est présent.
- Si `DATABASE_URL` n'est pas accessible au runtime serverless (ex: IP Vercel non autorisée, timeout ou variable non injectée), `getDb()` renvoie `null` et bascule silencieusement sur le store mémoire `memoryAnalyticsEvents`.

---

### Point 4 : Présence et utilisation réelle de la table analytics (migration 0066)
- **Fichier de migration** : `drizzle/0066_independent_site_analytics.sql`
- **Table** : `independentSiteAnalyticsEvents`
- **Déclenchement** : `vercel.json` exécute `node scripts/apply-schema-migrations.mjs && npm run build`.
- Si `DATABASE_URL` est défini lors du build, la table `independentSiteAnalyticsEvents` existe bien.
- **Constat** : La table existe, mais **aucune ligne n'y est insérée** pour un site en brouillon car l'appel est court-circuité en amont dans le routeur.

---

### Point 5 : Différence entre stockage mémoire et stockage DB en production
Dans `server/isolatedSiteBuilderDb.ts` (lignes 1881–1890) :
```typescript
const db = await getDb();
if (!db) {
  const list = memoryAnalyticsEvents.get(input.siteId) ?? [];
  list.unshift({ visitorKey, path, createdAt: new Date().toISOString() });
  memoryAnalyticsEvents.set(input.siteId, list.slice(0, 10000));
  return { recorded: true } as const;
}
await db.insert(independentSiteAnalyticsEvents).values({ siteId: input.siteId, eventType: "page_view", visitorKey, path });
```
- En environnement Serverless Vercel (sans base ou en cas de coupure DB), le stockage mémoire `memoryAnalyticsEvents` est un `Map` local à un conteneur Lambda.
- Chaque requête (visiteur public vs administrateur connecté) peut être exécutée sur des conteneurs Lambda distincts.
- La mémoire n'étant pas partagée entre Lambdas, les événements écrits sur la Lambda A ne sont jamais visibles sur la Lambda B.

---

### Point 6 : Lecture effectuée par `getAnalyticsSummary`
Dans `server/isolatedSiteBuilderDb.ts` (lignes 1892–1905) :
```typescript
export async function getIndependentSiteAnalyticsSummary(siteId: number) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const db = await getDb();
  const events = db
    ? await db.select().from(independentSiteAnalyticsEvents).where(and(eq(independentSiteAnalyticsEvents.siteId, siteId), gt(independentSiteAnalyticsEvents.createdAt, since)))
    : (memoryAnalyticsEvents.get(siteId) ?? []).filter((event) => new Date(event.createdAt) > since);
  const pageViews = events.filter((event) => !("eventType" in event) || event.eventType === "page_view");
  const visitors = new Set(pageViews.map((event) => event.visitorKey)).size;
  ...
  return { visitors, pageViews: pageViews.length, popularPages, formsReceived: ... };
}
```
- Le calcul d'agrégation (comptage distinct des `visitorKey`, total des `pageViews`, top 5 `popularPages`, formulaires reçus) est mathématiquement et logiquement **rigoureusement exact**.
- S'il y a des lignes dans `independentSiteAnalyticsEvents` pour ce `siteId`, l'agrégation fonctionne parfaitement (vérifié par test unitaire).

---

### Point 7 : Filtres de date, de `siteId` et de type d'événement
- **Filtre `siteId`** : Strict match `eq(independentSiteAnalyticsEvents.siteId, siteId)`.
  Si le client public affichait le template ATH VAHLOUL via son fallback `fallbackDemoSite` (où `site.id` vaut `0` ou `queryParams.siteId ?? 0`), et que l'admin interroge le `siteId` réel (ex: `1` ou `1001`), les IDs ne correspondaient pas.
- **Filtre de date** : `gt(independentSiteAnalyticsEvents.createdAt, since)` sur une fenêtre glissante de 30 jours (`Date.now() - 30 * 24 * 60 * 60 * 1000`). Conforme.
- **Filtre type d'événement** : `eventType = 'page_view'`. Conforme.

---

### Point 8 : Erreurs silencieuses et réponses HTTP non contrôlées
**C'est la cause immédiate de l'illusion de fonctionnement dans les logs Vercel :**
- Dans tRPC, lorsqu'une mutation renvoie un objet `{ recorded: false }`, la réponse HTTP est **200 OK**.
- Les logs Vercel affichent : `POST /api/trpc/independentSiteBuilder.recordPageView 200 OK`.
- Ni le client ni l'opérateur ne voient d'erreur HTTP 4xx ou 5xx.
- Mais en réalité, le serveur a renvoyé `{ recorded: false }` sans toucher à la base de données.

---

### Point 9 : Cache tRPC et requêtes non invalidées
Dans `client/src/pages/site-builder/IndependentSiteAdminPage.tsx` (lignes 319–322) :
```typescript
const analyticsQuery = trpc.independentSiteBuilder.getAnalyticsSummary.useQuery(
  { siteId: siteId ?? 0 },
  { enabled: Boolean(siteId), retry: false, refetchOnWindowFocus: false },
);
```
- L'option `refetchOnWindowFocus: false` désactive le rafraîchissement automatique lorsque l'administrateur revient sur l'onglet d'administration après avoir visité la vitrine dans un autre onglet.
- L'interface ne propose aucun bouton « Actualiser les statistiques ».
- Même si une visite était enregistrée, l'administrateur devrait manuellement recharger toute la page web (`F5`) pour forcer une ré-interrogation.

---

### Point 10 : Déploiements et régions Vercel
- Vercel exécute les routes API en mode serverless multi-régions (Edge / Node.js Lambdas).
- Toute persistance dépendante de `memoryAnalyticsEvents` échoue par conception en architecture serverless.
- Seule l'écriture réelle dans MySQL via `DATABASE_URL` garantit la convergence des statistiques entre les visiteurs anonymes et les administrateurs connectés.

---

## 3. Diagnostic Synthétique de la Cause Racine

La cause racine est la conjonction de deux mécanismes :

1. **Court-circuit dans la résolution du slug (`isolatedSiteBuilderRouter.ts`)** :
   `recordPageView` utilise `getPublicIndependentSiteBySlug(input.slug, { allowDraftForOwnerUserId: undefined })` pour trouver le `siteId`. Or, pour protéger les brouillons contre les fuites publiques, cette fonction renvoie `null` si le site n'a pas été publié (`status !== "published"` ou `publishedSnapshot === null`).
   Comme le site ATH VAHLOUL est en cours de gestion / staging sous statut brouillon et n'a pas été publié (conformément aux consignes strictes du chantier), `getPublicIndependentSiteBySlug` renvoie systématiquement `null`.
   `recordPageView` retourne `{ recorded: false }` avec un code 200 OK sans rien enregistrer.

2. **Désynchronisation entre fallback vitrine client et base serveur** :
   Dans `IndependentSitePublicPreviewPage.tsx`, le client dispose d'un `fallbackDemoSite` pour afficher la vitrine d'ATH VAHLOUL même si le site n'est pas encore publié. L'utilisateur voit donc le site s'afficher et croit qu'il est public en base, alors que le serveur refuse d'enregistrer la visite d'un site non publié.

---

## 4. Reproduction Locale et Validation par Test Automatisé

Un test automatisé a été créé sur cette branche dans :
`server/independentSiteAnalyticsInvestigation.test.ts`

**Résultat de l'exécution Vitest** :
```bash
✓ server/independentSiteAnalyticsInvestigation.test.ts (2 tests) 12ms
  ✓ REPRODUCTION : recordPageView retourne { recorded: false } pour un site en brouillon (ex: ATH VAHLOUL non publié)
  ✓ CORRECTION DEMONTREE : Résoudre le site par son slug permet d'enregistrer la visite et de peupler les statistiques
Test Files  1 passed (1)
Tests       2 passed (2)
```

Le premier test reproduit exactement l'anomalie : un site en statut `"draft"` reçoit un appel `recordPageView`, qui renvoie `{ recorded: false }`, et `getAnalyticsSummary` retourne `0`.
Le second test prouve que la résolution directe du slug dans `independentSites` résout le problème et alimente fidèlement les statistiques.

---

## 5. Proposition de Correction Minimale

### Fichier 1 : `server/isolatedSiteBuilderDb.ts`
Ajouter une fonction utilitaire dédiée à la résolution d'identifiant par slug pour les analytics (sans exiger le statut `published`) :

```typescript
export async function resolveIndependentSiteIdForAnalytics(slug: string): Promise<number | null> {
  const normalized = slugifyIndependentSite(slug);
  const db = await getDb();
  if (!db) {
    for (const site of Array.from(memorySites.values())) {
      if (site.slug === normalized) return site.id;
    }
    return null;
  }
  const rows = await db
    .select({ id: independentSites.id })
    .from(independentSites)
    .where(eq(independentSites.slug, normalized))
    .limit(1);
  return rows[0]?.id ?? null;
}
```

### Fichier 2 : `server/isolatedSiteBuilderRouter.ts`
Dans la mutation `recordPageView` :

```typescript
  recordPageView: publicProcedure.input(z.object({
    slug: z.string().trim().min(1).max(120),
    visitorKey: z.string().regex(/^[a-f0-9]{16,64}$/i),
    path: z.string().trim().max(240).default("/"),
  })).mutation(async ({ input }) => {
    const siteId = await resolveIndependentSiteIdForAnalytics(input.slug);
    if (!siteId) return { recorded: false } as const;
    return recordIndependentSitePageView({ siteId, visitorKey: input.visitorKey, path: input.path });
  }),
```

### Fichier 3 : `client/src/pages/site-builder/IndependentSiteAdminPage.tsx`
Dans l'onglet Statistiques, ajouter :
1. L'invalidation ou le rafraîchissement lors du clic sur l'onglet `statistics` (`analyticsQuery.refetch()`).
2. Un bouton « Actualiser » avec indicateur de chargement discret pour permettre à l'administrateur de rafraîchir ses statistiques à la demande.

---

## 6. Respect des Contraintes

- **Aucune modification sur `main`** : L'ensemble de l'audit et des tests de reproduction a été réalisé sur la branche dédiée `audit/independent-site-analytics-investigation`.
- **Aucun déploiement lancé**.
- **Aucune donnée de production modifiée**.
- **Aucune publication du site ATH VAHLOUL**.
- **Aucune boutique MAZIGOSHOP modifiée**.
