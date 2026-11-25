export type InteractiveBlockTrait = {
  type: string;
  name: string;
  label: string;
  default?: string;
  options?: string[];
};

export type SharedInteractiveBlock = {
  id: string;
  label: string;
  category: "Modules · Information & Services" | "Modules · Interactions & Médias" | "Contact & Décoration" | "Navigation & Structure";
  description: string;
  title: string;
  html: string;
  script?: string;
  traits: InteractiveBlockTrait[];
};

const root = "data-mazigho-interactive=\"true\"";
const commonTraits = [{ type: "text", name: "data-mazigho-label", label: "Libellé" }];

export const SHARED_INTERACTIVE_BLOCKS: ReadonlyArray<SharedInteractiveBlock> = [
  {
    id: "mazigho-interactive-map",
    label: "Carte interactive & itinéraire",
    title: "Carte interactive & itinéraire",
    category: "Modules · Information & Services",
    description: "Carte visuelle avec adresse éditable et lien d’itinéraire, sans adresse inventée.",
    html: `<section class="mz-interactive mz-interactive-map" ${root} data-mazigho-map-address="Adresse à renseigner" data-mazigho-map-height="280"><div class="mz-interactive__head"><h2>Nous trouver</h2><p data-mazigho-map-label>Adresse à renseigner</p></div><div class="mz-map-placeholder" role="img" aria-label="Emplacement de la carte à configurer">Carte à connecter</div><a class="mz-interactive__button" href="#" data-mazigho-map-link>Calculer l’itinéraire</a></section>`,
    traits: [...commonTraits, { type: "text", name: "data-mazigho-map-address", label: "Adresse" }, { type: "number", name: "data-mazigho-map-height", label: "Hauteur (px)", default: "280" }],
  },
  {
    id: "mazigho-interactive-opening-hours",
    label: "Horaires d’ouverture & statut live",
    title: "Horaires d’ouverture & statut live",
    category: "Modules · Information & Services",
    description: "Horaires éditables avec statut ouvert/fermé local, sans promesse de disponibilité métier.",
    html: `<section class="mz-interactive mz-hours" ${root} data-mazigho-timezone="Europe/Zurich"><div><h2>Horaires d’ouverture</h2><p class="mz-status" data-mazigho-open-status aria-live="polite">Statut à configurer</p></div><ul data-mazigho-hours-list><li><span>Lundi – Vendredi</span><strong>Horaires à renseigner</strong></li><li><span>Samedi</span><strong>Horaires à renseigner</strong></li><li><span>Dimanche</span><strong>Fermé ou à renseigner</strong></li></ul></section>`,
    script: `function(){var root=this; var status=root.querySelector('[data-mazigho-open-status]'); if(!status)return; status.textContent='Horaires à vérifier';}`,
    traits: [...commonTraits, { type: "text", name: "data-mazigho-timezone", label: "Fuseau horaire", default: "Europe/Zurich" }],
  },
  {
    id: "mazigho-interactive-pricing-table",
    label: "Tableau comparatif des tarifs",
    title: "Tableau comparatif des tarifs",
    category: "Modules · Information & Services",
    description: "Comparatif éditable avec emplacements de prix à renseigner par le propriétaire.",
    html: `<section class="mz-interactive mz-pricing" ${root}><h2>Comparer nos offres</h2><div class="mz-pricing__grid"><article><h3>Offre essentielle</h3><p class="mz-price">Tarif à renseigner</p><ul><li>Avantage à préciser</li><li>Service à préciser</li></ul><a href="#contact">En savoir plus</a></article><article class="is-featured"><span class="mz-badge">Recommandée</span><h3>Offre recommandée</h3><p class="mz-price">Tarif à renseigner</p><ul><li>Avantage à préciser</li><li>Service à préciser</li></ul><a href="#contact">En savoir plus</a></article><article><h3>Offre complète</h3><p class="mz-price">Tarif à renseigner</p><ul><li>Avantage à préciser</li><li>Service à préciser</li></ul><a href="#contact">En savoir plus</a></article></div></section>`,
    traits: [...commonTraits, { type: "text", name: "data-mazigho-featured-plan", label: "Offre recommandée", default: "Offre recommandée" }],
  },
  {
    id: "mazigho-interactive-tabs",
    label: "Onglets interactifs",
    title: "Onglets interactifs",
    category: "Modules · Interactions & Médias",
    description: "Onglets accessibles au clavier, titres et contenus entièrement éditables.",
    html: `<section class="mz-interactive mz-tabs" ${root}><div class="mz-tabs__nav" role="tablist"><button type="button" role="tab" aria-selected="true" aria-controls="mz-tab-panel-1">Présentation</button><button type="button" role="tab" aria-selected="false" aria-controls="mz-tab-panel-2">Détails</button><button type="button" role="tab" aria-selected="false" aria-controls="mz-tab-panel-3">Questions</button></div><div id="mz-tab-panel-1" role="tabpanel"><h2>Présentation</h2><p>Contenu à personnaliser.</p></div><div id="mz-tab-panel-2" role="tabpanel" hidden><h2>Détails</h2><p>Informations à personnaliser.</p></div><div id="mz-tab-panel-3" role="tabpanel" hidden><h2>Questions</h2><p>Réponses à personnaliser.</p></div></section>`,
    script: `function(){var root=this; var buttons=[].slice.call(root.querySelectorAll('[role=tab]')); buttons.forEach(function(btn,i){btn.addEventListener('click',function(){buttons.forEach(function(other,j){var panel=root.querySelector('#'+other.getAttribute('aria-controls')); var active=j===i; other.setAttribute('aria-selected',active?'true':'false'); if(panel)panel.hidden=!active;});});});}`,
    traits: [...commonTraits, { type: "text", name: "data-mazigho-tab-1", label: "Titre onglet 1", default: "Présentation" }, { type: "text", name: "data-mazigho-tab-2", label: "Titre onglet 2", default: "Détails" }, { type: "text", name: "data-mazigho-tab-3", label: "Titre onglet 3", default: "Questions" }],
  },
  {
    id: "mazigho-interactive-slider",
    label: "Carrousel / slider multi-contenus",
    title: "Carrousel / slider multi-contenus",
    category: "Modules · Interactions & Médias",
    description: "Carrousel autonome avec boutons et support du clavier, sans contenu externe imposé.",
    html: `<section class="mz-interactive mz-slider" ${root} data-mazigho-autoplay="false" data-mazigho-interval="5000"><div class="mz-slider__viewport"><article class="is-active"><h2>Contenu 1</h2><p>Texte ou visuel à personnaliser.</p></article><article><h2>Contenu 2</h2><p>Texte ou visuel à personnaliser.</p></article><article><h2>Contenu 3</h2><p>Texte ou visuel à personnaliser.</p></article></div><div class="mz-slider__controls"><button type="button" data-mz-prev aria-label="Contenu précédent">←</button><span data-mz-count>1 / 3</span><button type="button" data-mz-next aria-label="Contenu suivant">→</button></div></section>`,
    script: `function(){var root=this,items=[].slice.call(root.querySelectorAll('.mz-slider__viewport>article')),index=0;function render(){items.forEach(function(item,i){item.classList.toggle('is-active',i===index);});var count=root.querySelector('[data-mz-count]');if(count)count.textContent=(index+1)+' / '+items.length;}var next=root.querySelector('[data-mz-next]'),prev=root.querySelector('[data-mz-prev]');if(next)next.addEventListener('click',function(){index=(index+1)%items.length;render();});if(prev)prev.addEventListener('click',function(){index=(index+items.length-1)%items.length;render();});render();}`,
    traits: [...commonTraits, { type: "checkbox", name: "data-mazigho-autoplay", label: "Lecture automatique" }, { type: "number", name: "data-mazigho-interval", label: "Intervalle (ms)", default: "5000" }],
  },
  {
    id: "mazigho-interactive-social-grid",
    label: "Grille réseaux sociaux & partage",
    title: "Grille réseaux sociaux & partage",
    category: "Modules · Interactions & Médias",
    description: "Liens sociaux éditables et partage de page sans compte social prérempli.",
    html: `<section class="mz-interactive mz-social" ${root}><h2>Retrouvez-nous</h2><div class="mz-social__grid"><a href="#" rel="noopener" data-mazigho-social="instagram">Instagram</a><a href="#" rel="noopener" data-mazigho-social="facebook">Facebook</a><a href="#" rel="noopener" data-mazigho-social="linkedin">LinkedIn</a><button type="button" data-mazigho-share>Partager cette page</button></div></section>`,
    script: `function(){var root=this,share=root.querySelector('[data-mazigho-share]');if(share)share.addEventListener('click',function(){if(navigator.share)navigator.share({title:document.title,url:location.href});else if(navigator.clipboard)navigator.clipboard.writeText(location.href);});}`,
    traits: [...commonTraits, { type: "text", name: "data-mazigho-social-instagram", label: "Lien Instagram" }, { type: "text", name: "data-mazigho-social-facebook", label: "Lien Facebook" }, { type: "text", name: "data-mazigho-social-linkedin", label: "Lien LinkedIn" }],
  },
  {
    id: "mazigho-interactive-newsletter",
    label: "Inscription newsletter & prospects",
    title: "Inscription newsletter & prospects",
    category: "Contact & Décoration",
    description: "Formulaire visuel à connecter à un service autorisé, sans simuler l’enregistrement d’un prospect.",
    html: `<section class="mz-interactive mz-newsletter" ${root} data-mazigho-lead-provider="a-configurer"><h2>Recevoir nos nouvelles</h2><p>Inscrivez-vous pour recevoir les prochaines informations.</p><form data-mazigho-lead-form><label for="mz-newsletter-email">Adresse e-mail</label><input id="mz-newsletter-email" type="email" required placeholder="vous@exemple.ch"><label class="mz-consent"><input type="checkbox" required> J’accepte le traitement de mes données selon la politique de confidentialité.</label><button type="submit">S’inscrire</button><p class="mz-form-status" aria-live="polite"></p></form></section>`,
    script: `function(){var form=this.querySelector('[data-mazigho-lead-form]');if(!form)return;form.addEventListener('submit',function(e){e.preventDefault();var status=form.querySelector('.mz-form-status');if(status)status.textContent='Formulaire prêt à être relié au service autorisé.';});}`,
    traits: [...commonTraits, { type: "text", name: "data-mazigho-lead-provider", label: "Service de leads", default: "a-configurer" }, { type: "checkbox", name: "data-mazigho-consent-required", label: "Consentement requis" }],
  },
  {
    id: "mazigho-interactive-floating-contact",
    label: "Bouton WhatsApp / appel flottant",
    title: "Bouton WhatsApp / appel flottant",
    category: "Contact & Décoration",
    description: "Bouton de contact flottant avec téléphone et message à renseigner.",
    html: `<div class="mz-floating-contact" ${root} data-mazigho-position="right"><a href="tel:" data-mazigho-phone aria-label="Appeler">☎</a><a href="#" data-mazigho-whatsapp aria-label="Ouvrir WhatsApp">WhatsApp</a></div>`,
    traits: [...commonTraits, { type: "text", name: "data-mazigho-phone", label: "Téléphone" }, { type: "text", name: "data-mazigho-whatsapp-message", label: "Message WhatsApp" }, { type: "select", name: "data-mazigho-position", label: "Position", options: ["left", "right"] }],
  },
  {
    id: "mazigho-interactive-countdown",
    label: "Compte à rebours",
    title: "Compte à rebours",
    category: "Contact & Décoration",
    description: "Compte à rebours éditable avec date cible vide par défaut.",
    html: `<section class="mz-interactive mz-countdown" ${root} data-mazigho-target=""><h2>Rendez-vous à venir</h2><div class="mz-countdown__digits" data-mz-countdown><span>--</span><span>--</span><span>--</span><span>--</span></div><p>Configurez la date cible dans les traits.</p></section>`,
    script: `function(){var root=this,target=root.getAttribute('data-mazigho-target'),out=root.querySelector('[data-mz-countdown]');if(!target||!out)return;function tick(){var d=Math.max(0,new Date(target).getTime()-Date.now()),v=[Math.floor(d/864e5),Math.floor(d/36e5)%24,Math.floor(d/6e4)%60,Math.floor(d/1e3)%60];out.innerHTML=v.map(function(n){return '<span>'+String(n).padStart(2,'0')+'</span>';}).join('');}tick();var timer=setInterval(tick,1000);root.addEventListener('remove',function(){clearInterval(timer);});}`,
    traits: [...commonTraits, { type: "text", name: "data-mazigho-target", label: "Date cible ISO", default: "" }],
  },
  {
    id: "mazigho-interactive-top-announcement",
    label: "Barre d’annonce supérieure",
    title: "Barre d’annonce supérieure",
    category: "Navigation & Structure",
    description: "Annonce dismissible, accessible et éditable, sans promotion ni date inventée.",
    html: `<aside class="mz-top-announcement" ${root} role="status"><p data-mazigho-announcement-text>Annonce à personnaliser</p><button type="button" data-mz-dismiss aria-label="Fermer l’annonce">×</button></aside>`,
    script: `function(){var root=this,button=root.querySelector('[data-mz-dismiss]');if(button)button.addEventListener('click',function(){root.hidden=true;});}`,
    traits: [...commonTraits, { type: "text", name: "data-mazigho-announcement-text", label: "Texte de l’annonce", default: "Annonce à personnaliser" }, { type: "checkbox", name: "data-mazigho-dismissible", label: "Fermeture autorisée", default: "true" }],
  },
];

export const SHARED_INTERACTIVE_CSS = `
[data-mazigho-interactive="true"], .mz-top-announcement { --mz-interactive-primary: var(--theme-primary, var(--mz-primary, #172033)); --mz-interactive-secondary: var(--theme-secondary, var(--mz-secondary, #f5b98f)); --mz-interactive-bg: var(--theme-background, var(--mz-bg, #fff)); --mz-interactive-surface: var(--theme-surface, #faf8f5); --mz-interactive-text: var(--theme-text, var(--mz-text, #172033)); --mz-interactive-muted: var(--theme-muted, #5b6470); --mz-interactive-font: var(--theme-font, var(--mz-font, sans-serif)); --mz-interactive-radius: var(--theme-radius, var(--mz-radius, 10px)); box-sizing:border-box; font-family:var(--mz-interactive-font); color:var(--mz-interactive-text); }
[data-mazigho-interactive="true"] *, .mz-top-announcement * { box-sizing:border-box; }
.mz-interactive { width:100%; max-width:1180px; margin:0 auto; padding:36px 24px; background:var(--mz-interactive-bg); }
.mz-interactive h2 { margin:0 0 10px; font-size:clamp(1.35rem,2.5vw,2rem); } .mz-interactive p { color:var(--mz-interactive-muted); line-height:1.6; }
.mz-interactive__button,.mz-social a,.mz-social button,.mz-newsletter button,.mz-pricing a { display:inline-flex; align-items:center; justify-content:center; min-height:42px; padding:10px 16px; border:1px solid transparent; border-radius:var(--mz-interactive-radius); background:var(--mz-interactive-primary); color:#fff; text-decoration:none; font-weight:700; cursor:pointer; }
.mz-map-placeholder { min-height:280px; margin:18px 0; display:grid; place-items:center; border-radius:var(--mz-interactive-radius); background:color-mix(in srgb,var(--mz-interactive-secondary) 22%,var(--mz-interactive-bg)); color:var(--mz-interactive-muted); }
.mz-hours,.mz-newsletter,.mz-pricing article,.mz-tabs,.mz-slider,.mz-social { border:1px solid color-mix(in srgb,var(--mz-interactive-primary) 16%,transparent); border-radius:var(--mz-interactive-radius); background:var(--mz-interactive-surface); }
.mz-hours { display:flex; gap:24px; justify-content:space-between; flex-wrap:wrap; } .mz-hours ul { min-width:280px; margin:0; padding:0; list-style:none; } .mz-hours li { display:flex; justify-content:space-between; gap:20px; padding:10px 0; border-bottom:1px solid color-mix(in srgb,var(--mz-interactive-primary) 12%,transparent); }
.mz-status { display:inline-block; padding:6px 10px; border-radius:999px; background:color-mix(in srgb,var(--mz-interactive-secondary) 45%,transparent); }
.mz-pricing__grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; } .mz-pricing article { position:relative; padding:22px; } .mz-pricing article.is-featured { border:2px solid var(--mz-interactive-primary); } .mz-pricing ul { padding-left:18px; color:var(--mz-interactive-muted); line-height:1.8; } .mz-price { font-size:1.2rem; font-weight:800; color:var(--mz-interactive-text)!important; } .mz-badge { position:absolute; top:12px; right:12px; font-size:.75rem; color:var(--mz-interactive-primary); font-weight:800; }
.mz-tabs,.mz-slider,.mz-social,.mz-newsletter,.mz-countdown { padding:24px; } .mz-tabs__nav,.mz-slider__controls,.mz-social__grid { display:flex; gap:8px; flex-wrap:wrap; } .mz-tabs__nav button,.mz-slider__controls button { padding:10px 14px; border:1px solid color-mix(in srgb,var(--mz-interactive-primary) 20%,transparent); border-radius:var(--mz-interactive-radius); background:var(--mz-interactive-bg); color:var(--mz-interactive-text); cursor:pointer; } .mz-tabs__nav button[aria-selected=true] { background:var(--mz-interactive-primary); color:#fff; } .mz-tabs [role=tabpanel] { padding-top:18px; }
.mz-slider__viewport>article { display:none; min-height:130px; padding:20px; } .mz-slider__viewport>article.is-active { display:block; } .mz-slider__controls { justify-content:space-between; align-items:center; }
.mz-social__grid { margin-top:18px; } .mz-social a,.mz-social button { background:var(--mz-interactive-bg); color:var(--mz-interactive-primary); border-color:color-mix(in srgb,var(--mz-interactive-primary) 25%,transparent); } .mz-newsletter form { display:grid; gap:10px; max-width:560px; } .mz-newsletter input { min-height:42px; padding:8px 12px; border:1px solid #cbd5e1; border-radius:var(--mz-interactive-radius); } .mz-consent { display:flex; gap:8px; color:var(--mz-interactive-muted); font-size:.9rem; }
.mz-floating-contact { position:fixed; z-index:20; right:18px; bottom:18px; display:flex; gap:8px; flex-direction:column; } .mz-floating-contact[data-mazigho-position=left] { right:auto; left:18px; } .mz-floating-contact a { display:grid; place-items:center; min-width:48px; min-height:48px; padding:8px 12px; border-radius:999px; background:var(--mz-interactive-primary,#172033); color:#fff; text-decoration:none; box-shadow:0 8px 20px #0002; }
.mz-countdown__digits { display:flex; gap:10px; flex-wrap:wrap; } .mz-countdown__digits span { min-width:64px; padding:14px 10px; border-radius:var(--mz-interactive-radius); background:var(--mz-interactive-primary); color:#fff; text-align:center; font-size:1.35rem; font-weight:800; } .mz-top-announcement { display:flex; align-items:center; justify-content:center; gap:16px; width:100%; padding:10px 16px; background:var(--mz-interactive-primary); color:#fff; } .mz-top-announcement p { margin:0; color:inherit; } .mz-top-announcement button { border:0; background:transparent; color:inherit; font-size:1.2rem; cursor:pointer; }
@media (max-width: 760px) { .mz-pricing__grid { grid-template-columns:1fr; } .mz-hours li { flex-direction:column; gap:4px; } .mz-interactive { padding:28px 16px; } .mz-floating-contact { right:10px; bottom:10px; } .mz-floating-contact[data-mazigho-position=left] { left:10px; } }
@media (prefers-reduced-motion: reduce) { *,*::before,*::after { scroll-behavior:auto!important; animation-duration:.01ms!important; transition-duration:.01ms!important; } }
`;
