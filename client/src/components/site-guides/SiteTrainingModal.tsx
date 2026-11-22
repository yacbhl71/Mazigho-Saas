import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Film,
  HelpCircle,
  Monitor,
  Play,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GuideStepIllustration } from "./GuideStepIllustration";
import type { SiteTrainingGuideConfig } from "./guideTypes";

export type TrainingModalMode = "guide" | "video";

interface SiteTrainingModalProps {
  open: boolean;
  mode: TrainingModalMode;
  onModeChange: (mode: TrainingModalMode) => void;
  onClose: () => void;
  config: SiteTrainingGuideConfig;
  activeSiteName?: string;
}

export function SiteTrainingModal({
  open,
  mode,
  onModeChange,
  onClose,
  config,
  activeSiteName,
}: SiteTrainingModalProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [showDetailedHelp, setShowDetailedHelp] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [activeChapterIdx, setActiveChapterIdx] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const steps = config.steps;
  const totalSteps = steps.length;
  const currentStep = steps[Math.min(stepIndex, totalSteps - 1)] ?? steps[0];
  const progressPercent = Math.round(((stepIndex + 1) / Math.max(totalSteps, 1)) * 100);

  useEffect(() => {
    if (!open) return;
    setVideoError(false);
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (mode === "guide") {
        if (event.key === "ArrowRight") {
          setStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
          setShowDetailedHelp(false);
        } else if (event.key === "ArrowLeft") {
          setStepIndex((prev) => Math.max(prev - 1, 0));
          setShowDetailedHelp(false);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, mode, onClose, totalSteps]);

  if (!open || !currentStep) return null;

  function jumpToChapter(chapterIndex: number) {
    const chapter = config.video.chapters[chapterIndex];
    if (!chapter) return;
    setActiveChapterIdx(chapterIndex);
    const videoEl = videoRef.current;
    if (videoEl) {
      try {
        videoEl.currentTime = chapter.startSec;
        const playPromise = videoEl.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(() => {
            // Autoplay may be blocked by browser policy; user can click play directly
          });
        }
      } catch {
        // Ignore seek errors before metadata is loaded
      }
    }
  }

  function handleVideoTimeUpdate() {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    const t = videoEl.currentTime;
    const chapters = config.video.chapters;
    let found = 0;
    for (let i = 0; i < chapters.length; i++) {
      if (t >= chapters[i].startSec) {
        found = i;
      }
    }
    if (found !== activeChapterIdx) {
      setActiveChapterIdx(found);
    }
  }

  const dialogContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="site-training-modal-title"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/75 p-2 sm:p-4"
    >
      <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-2xl">
        {/* EN-TÊTE DU DIALOGUE */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 bg-[#f8fafc] px-3.5 py-3 sm:px-6 sm:py-4">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] font-semibold text-[#1e3a2f] sm:text-xs">
              <span>{config.audienceLabel}</span>
              {activeSiteName && (
                <>
                  <span className="text-slate-300" aria-hidden="true">
                    ·
                  </span>
                  <span className="truncate text-slate-600">{activeSiteName}</span>
                </>
              )}
            </div>
            <h2
              id="site-training-modal-title"
              className="text-sm font-bold leading-snug tracking-tight text-slate-900 sm:text-lg"
            >
              {config.modalTitle}
            </h2>
            <p className="hidden text-xs leading-relaxed text-slate-600 sm:block sm:text-sm">
              {config.modalSubtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le guide"
            className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a2f] motion-reduce:transition-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* RAPPEL OBLIGATOIRE D'ISOLATION (ESPACE CLIENT UNIQUEMENT) */}
        {config.isolationNotice && (
          <div className="shrink-0 border-b border-emerald-200 bg-emerald-50/90 px-3.5 py-2 sm:px-6 sm:py-2.5">
            <div className="flex items-start gap-2 text-[11px] leading-snug text-emerald-950 sm:gap-2.5 sm:text-xs sm:leading-relaxed">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#1e3a2f]" />
              <p className="font-medium">{config.isolationNotice}</p>
            </div>
          </div>
        )}

        {/* BASCULE GUIDE ILLUSTRÉ / VIDÉO */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2.5 border-b border-slate-200 bg-white px-3.5 py-2 sm:gap-3 sm:px-6 sm:py-2.5">
          <div
            role="tablist"
            aria-label="Format de prise en main"
            className="inline-flex w-full rounded-lg border border-slate-200 bg-slate-100 p-1 sm:w-auto"
          >
            <button
              type="button"
              role="tab"
              aria-selected={mode === "guide"}
              onClick={() => onModeChange("guide")}
              className={`inline-flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-md px-3.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a2f] motion-reduce:transition-none sm:flex-initial sm:text-sm ${
                mode === "guide"
                  ? "bg-[#1e3a2f] text-white shadow-2xs"
                  : "text-slate-700 hover:text-slate-900"
              }`}
            >
              <BookOpen className="h-4 w-4 shrink-0" />
              <span>Guide illustré ({totalSteps} étapes)</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "video"}
              onClick={() => onModeChange("video")}
              className={`inline-flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-md px-3.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a2f] motion-reduce:transition-none sm:flex-initial sm:text-sm ${
                mode === "video"
                  ? "bg-[#1e3a2f] text-white shadow-2xs"
                  : "text-slate-700 hover:text-slate-900"
              }`}
            >
              <Film className="h-4 w-4 shrink-0" />
              <span>Vidéo ({config.video.durationLabel})</span>
            </button>
          </div>

          {mode === "guide" ? (
            <div className="flex w-full items-center gap-3 sm:w-auto">
              <span className="text-xs font-semibold text-slate-700 tabular-nums">
                Étape {currentStep.number} / {totalSteps}
              </span>
              <div
                className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 sm:w-36"
                role="progressbar"
                aria-valuenow={currentStep.number}
                aria-valuemin={1}
                aria-valuemax={totalSteps}
                aria-label="Progression du guide"
              >
                <div
                  className="h-full bg-[#1e3a2f] transition-all motion-reduce:transition-none"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 tabular-nums">
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                {config.video.durationLabel}
              </span>
              <span className="inline-flex items-center gap-1">
                <Monitor className="h-3.5 w-3.5 text-slate-400" />
                {config.video.resolutionLabel}
              </span>
              <span>{config.video.chapters.length} chapitres</span>
            </div>
          )}
        </div>

        {/* CORPS PRINCIPAL DÉFILANT */}
        <div className="min-h-0 flex-1 overflow-y-auto bg-[#f8fafc] p-4 sm:p-6">
          {mode === "guide" ? (
            <div className="grid gap-5 lg:grid-cols-[248px_minmax(0,1fr)]">
              {/* SOMMAIRE DES 18 ÉTAPES (SELECT MOBILE + LISTE DESKTOP) */}
              <div className="lg:hidden">
                <label
                  htmlFor="site-guide-step-select"
                  className="mb-1.5 block text-xs font-semibold text-slate-700"
                >
                  Aller directement à une étape
                </label>
                <select
                  id="site-guide-step-select"
                  value={stepIndex}
                  onChange={(e) => {
                    setStepIndex(Number(e.target.value));
                    setShowDetailedHelp(false);
                  }}
                  className="min-h-[44px] w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-900 focus:border-[#1e3a2f] focus:outline-none focus:ring-2 focus:ring-[#1e3a2f]/20"
                >
                  {steps.map((step, idx) => (
                    <option key={step.id} value={idx}>
                      {String(step.number).padStart(2, "0")}. {step.title}
                    </option>
                  ))}
                </select>
              </div>

              <aside className="hidden lg:block">
                <div className="rounded-xl border border-slate-200 bg-white p-2">
                  <p className="px-2.5 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    Sommaire ({totalSteps} étapes)
                  </p>
                  <ol className="max-h-[480px] space-y-1 overflow-y-auto pr-1">
                    {steps.map((step, idx) => {
                      const active = idx === stepIndex;
                      const done = idx < stepIndex;
                      return (
                        <li key={step.id}>
                          <button
                            type="button"
                            onClick={() => {
                              setStepIndex(idx);
                              setShowDetailedHelp(false);
                            }}
                            aria-current={active ? "step" : undefined}
                            className={`flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a2f] motion-reduce:transition-none ${
                              active
                                ? "bg-[#1e3a2f] font-semibold text-white"
                                : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                          >
                            <span
                              className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold tabular-nums ${
                                active
                                  ? "bg-white text-[#1e3a2f]"
                                  : done
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {step.number}
                            </span>
                            <span className="leading-snug">{step.title}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </aside>

              {/* CONTENU DE L'ÉTAPE ACTIVE */}
              <div className="min-w-0 space-y-4">
                <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#1e3a2f]">
                      <span className="tabular-nums">
                        Étape {String(currentStep.number).padStart(2, "0")}
                      </span>
                      <span className="text-slate-300" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-slate-600">{currentStep.category}</span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 sm:text-lg">
                      {currentStep.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-slate-700">
                      {currentStep.summary}
                    </p>
                  </div>

                  {/* ILLUSTRATION ANONYMISÉE */}
                  <GuideStepIllustration
                    kind={currentStep.illustration}
                    caption={currentStep.caption}
                  />

                  {/* ACTIONS CONCRÈTES */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Comment procéder
                    </p>
                    <ol className="space-y-2">
                      {currentStep.actions.map((action, idx) => (
                        <li
                          key={action}
                          className="flex items-start gap-2.5 text-sm leading-relaxed text-slate-800"
                        >
                          <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-[#1e3a2f] tabular-nums">
                            {idx + 1}
                          </span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* AIDE DÉTAILLÉE DÉPLIABLE */}
                  <div className="border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowDetailedHelp((prev) => !prev)}
                      aria-expanded={showDetailedHelp}
                      className="inline-flex min-h-[40px] items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a2f]"
                    >
                      <HelpCircle className="h-4 w-4 text-[#1e3a2f]" />
                      <span>
                        {showDetailedHelp
                          ? "Masquer l’aide détaillée"
                          : "Afficher l’aide détaillée"}
                      </span>
                    </button>
                    {showDetailedHelp && (
                      <div className="mt-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs leading-relaxed text-slate-700">
                        {currentStep.detailedHelp}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* MODE VIDÉO RÉELLE + CHAPITRES + TRANSCRIPTION */
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_312px]">
              <div className="min-w-0 space-y-4">
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
                  {videoError ? (
                    <div className="flex flex-col items-center justify-center gap-3 p-8 text-center text-white">
                      <AlertTriangle className="h-8 w-8 text-amber-400" />
                      <p className="text-sm font-semibold">
                        La lecture vidéo n’est pas disponible sur ce navigateur.
                      </p>
                      <p className="max-w-md text-xs leading-relaxed text-slate-300">
                        Vous pouvez consulter le script complet ci-dessous ou suivre le guide
                        illustré étape par étape.
                      </p>
                      <Button
                        type="button"
                        onClick={() => onModeChange("guide")}
                        className="min-h-[44px] bg-white text-slate-900 hover:bg-slate-100"
                      >
                        <BookOpen className="mr-2 h-4 w-4" />
                        Ouvrir le guide illustré
                      </Button>
                    </div>
                  ) : (
                    <video
                      ref={videoRef}
                      key={config.video.mp4Src}
                      controls
                      playsInline
                      preload="metadata"
                      poster={config.video.posterSrc}
                      onTimeUpdate={handleVideoTimeUpdate}
                      onError={() => setVideoError(true)}
                      className="aspect-video w-full bg-slate-950"
                    >
                      <source src={config.video.mp4Src} type="video/mp4" />
                      <track
                        kind="subtitles"
                        src={config.video.vttSrc}
                        srcLang="fr"
                        label="Français"
                      />
                      Votre navigateur ne prend pas en charge la lecture vidéo HTML5.
                    </video>
                  )}
                </div>

                {/* CHAPITRE EN COURS + SCRIPT COMPLET */}
                <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <p className="text-xs font-semibold text-[#1e3a2f] tabular-nums">
                        Chapitre {String(activeChapterIdx + 1).padStart(2, "0")} /{" "}
                        {config.video.chapters.length} ·{" "}
                        {config.video.chapters[activeChapterIdx]?.timecode}
                      </p>
                      <h3 className="text-sm font-bold text-slate-900 sm:text-base">
                        {config.video.chapters[activeChapterIdx]?.title}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowTranscript((prev) => !prev)}
                      aria-expanded={showTranscript}
                      className="inline-flex min-h-[40px] items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-800 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a2f]"
                    >
                      <FileText className="h-3.5 w-3.5 text-[#1e3a2f]" />
                      {showTranscript ? "Masquer la transcription" : "Lire la transcription"}
                    </button>
                  </div>
                  <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                    {config.video.chapters[activeChapterIdx]?.narration}
                  </p>

                  {showTranscript && (
                    <div className="max-h-56 space-y-2.5 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs">
                      {config.video.chapters.map((chapter, idx) => (
                        <div key={chapter.index} className="space-y-0.5">
                          <button
                            type="button"
                            onClick={() => jumpToChapter(idx)}
                            className="font-semibold text-[#1e3a2f] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a2f]"
                          >
                            [{chapter.timecode}] {chapter.index}. {chapter.title}
                          </button>
                          <p className="leading-relaxed text-slate-700">{chapter.narration}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* LISTE INTERACTIVE DES CHAPITRES */}
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="px-2 pb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  Chapitres de la vidéo ({config.video.chapters.length})
                </p>
                <ol className="max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
                  {config.video.chapters.map((chapter, idx) => {
                    const active = idx === activeChapterIdx;
                    return (
                      <li key={chapter.index}>
                        <button
                          type="button"
                          onClick={() => jumpToChapter(idx)}
                          className={`flex w-full items-start gap-2.5 rounded-lg border px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1e3a2f] motion-reduce:transition-none ${
                            active
                              ? "border-[#1e3a2f] bg-[#1e3a2f] text-white"
                              : "border-slate-200 bg-slate-50/70 text-slate-800 hover:bg-slate-100"
                          }`}
                        >
                          <span
                            className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[11px] font-bold tabular-nums ${
                              active
                                ? "bg-white/15 text-white"
                                : "bg-white text-[#1e3a2f] border border-slate-200"
                            }`}
                          >
                            <Play className="h-2.5 w-2.5" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-xs font-semibold">
                                {String(chapter.index).padStart(2, "0")}. {chapter.title}
                              </span>
                              <span
                                className={`shrink-0 text-[11px] tabular-nums ${
                                  active ? "text-emerald-100" : "text-slate-500"
                                }`}
                              >
                                {chapter.timecode}
                              </span>
                            </div>
                            <p
                              className={`mt-0.5 line-clamp-2 text-[11px] leading-snug ${
                                active ? "text-emerald-100/90" : "text-slate-600"
                              }`}
                            >
                              {chapter.summary}
                            </p>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* PIED DE DIALOGUE : NAVIGATION ÉTAPE PAR ÉTAPE / PASSER LE GUIDE */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-white px-3.5 py-2.5 sm:px-6 sm:py-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="min-h-[40px] px-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 sm:min-h-[44px] sm:px-3 sm:text-sm"
          >
            Passer le guide
          </Button>

          {mode === "guide" ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={stepIndex === 0}
                onClick={() => {
                  setStepIndex((prev) => Math.max(prev - 1, 0));
                  setShowDetailedHelp(false);
                }}
                className="min-h-[40px] border-slate-300 px-2.5 text-xs font-semibold sm:min-h-[44px] sm:px-4 sm:text-sm"
              >
                <ChevronLeft className="mr-0.5 h-4 w-4 sm:mr-1" />
                <span className="sm:hidden">Préc.</span>
                <span className="hidden sm:inline">Étape précédente</span>
              </Button>
              {stepIndex < totalSteps - 1 ? (
                <Button
                  type="button"
                  onClick={() => {
                    setStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
                    setShowDetailedHelp(false);
                  }}
                  className="min-h-[40px] bg-[#1e3a2f] px-3 text-xs font-semibold text-white hover:bg-[#162b23] sm:min-h-[44px] sm:px-4 sm:text-sm"
                >
                  <span className="sm:hidden">Suivant</span>
                  <span className="hidden sm:inline">Étape suivante</span>
                  <ChevronRight className="ml-0.5 h-4 w-4 sm:ml-1" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={onClose}
                  className="min-h-[40px] bg-[#1e3a2f] px-3 text-xs font-semibold text-white hover:bg-[#162b23] sm:min-h-[44px] sm:px-4 sm:text-sm"
                >
                  <CheckCircle2 className="mr-1.5 h-4 w-4" />
                  Terminer le guide
                </Button>
              )}
            </div>
          ) : (
            <Button
              type="button"
              onClick={() => onModeChange("guide")}
              className="min-h-[40px] bg-[#1e3a2f] px-3 text-xs font-semibold text-white hover:bg-[#162b23] sm:min-h-[44px] sm:px-4 sm:text-sm"
            >
              <BookOpen className="mr-1.5 h-4 w-4" />
              Ouvrir le guide illustré ({totalSteps} étapes)
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return dialogContent;
  return createPortal(dialogContent, document.body);
}
