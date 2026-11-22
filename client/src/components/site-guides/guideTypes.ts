export type GuideAudience = "owner-builder" | "client-admin";

export type GuideIllustrationKind =
  | "builder-site-selector"
  | "builder-site-id"
  | "builder-pages"
  | "builder-edit-text"
  | "builder-replace-image"
  | "builder-add-section"
  | "builder-add-block"
  | "builder-add-page"
  | "builder-preview"
  | "builder-responsive"
  | "builder-save"
  | "builder-links-check"
  | "builder-links-repair"
  | "builder-links-unknown"
  | "builder-history"
  | "builder-restore"
  | "builder-publish"
  | "builder-delivery-check"
  | "client-home"
  | "client-status"
  | "client-states"
  | "client-title"
  | "client-text"
  | "client-section"
  | "client-replace-image"
  | "client-media-library"
  | "client-preview"
  | "client-history"
  | "client-restore"
  | "client-team"
  | "client-roles"
  | "client-invite"
  | "client-revoke"
  | "client-isolation"
  | "client-logout"
  | "client-errors";

export interface GuideStep {
  id: string;
  number: number;
  category: string;
  title: string;
  summary: string;
  actions: string[];
  detailedHelp: string;
  illustration: GuideIllustrationKind;
  caption: string;
}

export interface GuideVideoChapter {
  index: number;
  startSec: number;
  durationSec: number;
  timecode: string;
  title: string;
  summary: string;
  narration: string;
}

export interface SiteTrainingGuideConfig {
  audience: GuideAudience;
  modalTitle: string;
  modalSubtitle: string;
  audienceLabel: string;
  isolationNotice?: string;
  steps: GuideStep[];
  video: {
    title: string;
    subtitle: string;
    mp4Src: string;
    vttSrc: string;
    posterSrc: string;
    durationLabel: string;
    resolutionLabel: string;
    chapters: GuideVideoChapter[];
  };
}
