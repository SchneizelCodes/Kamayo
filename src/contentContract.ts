export type ContentStatus =
  | 'draft'
  | 'fsl_review'
  | 'accessibility_check'
  | 'approved'
  | 'published'
  | 'archived';

export type LearningEvidenceType =
  | 'viewed'
  | 'comprehension_result'
  | 'retrieval_result'
  | 'self_practice'
  | 'educator_assessment';

export const EVIDENCE_LABELS: Record<
  LearningEvidenceType,
  { title: string; countsAsAssessedProduction: boolean; summary: string }
> = {
  viewed: {
    title: 'Viewed demonstration',
    countsAsAssessedProduction: false,
    summary: 'Clip was played. Watching alone is not counted as comprehension or signing proficiency.',
  },
  comprehension_result: {
    title: 'Comprehension check',
    countsAsAssessedProduction: false,
    summary: 'Learner identified meaning or context in a reviewed clip activity.',
  },
  retrieval_result: {
    title: 'Recall check',
    countsAsAssessedProduction: false,
    summary: 'Learner retrieved meaning after hidden prompts before viewing feedback.',
  },
  self_practice: {
    title: 'Self-reported practice',
    countsAsAssessedProduction: false,
    summary: 'Learner marked personal practice. Self-practice does not establish accurate FSL production.',
  },
  educator_assessment: {
    title: 'Educator-assessed production',
    countsAsAssessedProduction: true,
    summary: 'Reviewed against an FSL rubric by an approved Deaf/fluent FSL educator.',
  },
};

export interface SignVariant {
  id: string;
  conceptId: string;
  usageContext: string;
  regionalNotes: string;
  fslReviewedBy: string | null;
  status: ContentStatus;
}

export interface ReviewedMediaAsset {
  id: string;
  conceptId: string;
  contentVersion: number;
  src: string | null;
  captionText: string | null;
  performerCredit: string | null;
  contributorPermissionRef: string | null;
  fslReviewedBy: string | null;
  framingCheckedBy: string | null;
  allowLearnerPlayback: boolean;
  allowOfflinePack: boolean;
  mirrored: false;
  status: ContentStatus;
}

export interface ConceptRecord {
  id: string;
  conceptKey: string;
  domain: 'Greetings' | 'Family' | 'Everyday' | 'Repair';
  title: string;
  englishAliases: string[];
  filipinoAliases: string[];
  summary: string;
  contentVersion: number;
  status: ContentStatus;
  variants: SignVariant[];
  mediaAssets: ReviewedMediaAsset[];
  relatedConceptIds: string[];
}

export interface PracticeLogEntry {
  date: string;
  conceptId: string;
  evidenceType: LearningEvidenceType;
  activityVersion: number;
}

export type ContentIssueCategory =
  | 'clarity'
  | 'caption'
  | 'variation'
  | 'playback'
  | 'accessibility';

export interface ContentIssueDraft {
  conceptId: string;
  contentVersion: number;
  category: ContentIssueCategory;
  note: string;
}

export const CATALOGUE_TOPICS: ConceptRecord[] = [
  {
    id: 'topic-greetings',
    conceptKey: 'greetings-context',
    domain: 'Greetings',
    title: 'Greetings',
    englishAliases: ['hello', 'good morning', 'thank you', 'greetings'],
    filipinoAliases: ['kumusta', 'magandang umaga', 'salamat'],
    summary: 'Everyday Filipino Sign Language greetings taught in natural exchanges.',
    contentVersion: 1,
    status: 'fsl_review',
    variants: [],
    mediaAssets: [],
    relatedConceptIds: ['topic-repair'],
  },
  {
    id: 'topic-family',
    conceptKey: 'family-relationships',
    domain: 'Family',
    title: 'Family',
    englishAliases: ['mother', 'father', 'sibling', 'grandparent', 'family'],
    filipinoAliases: ['nanay', 'tatay', 'kapatid', 'lolo', 'lola', 'pamilya'],
    summary: 'Family and home relationships shaped around reviewed FSL usage rather than inferred gender rules.',
    contentVersion: 1,
    status: 'fsl_review',
    variants: [],
    mediaAssets: [],
    relatedConceptIds: ['topic-greetings'],
  },
  {
    id: 'topic-everyday',
    conceptKey: 'everyday-needs',
    domain: 'Everyday',
    title: 'Everyday',
    englishAliases: ['please', 'excuse me', 'help', 'everyday'],
    filipinoAliases: ['pakiusap', 'makikiraan', 'tulong'],
    summary: 'Practical daily exchanges for school, errands, and community spaces.',
    contentVersion: 1,
    status: 'fsl_review',
    variants: [],
    mediaAssets: [],
    relatedConceptIds: ['topic-greetings', 'topic-repair'],
  },
  {
    id: 'topic-repair',
    conceptKey: 'communication-repair',
    domain: 'Repair',
    title: 'Repair',
    englishAliases: ['again please', 'slower please', 'did not understand', 'clarify'],
    filipinoAliases: ['pakiulit', 'dahan-dahan', 'hindi naintindihan'],
    summary: 'How to ask for repetition, adjust pace, and honour another signer’s communication preference.',
    contentVersion: 1,
    status: 'draft',
    variants: [],
    mediaAssets: [],
    relatedConceptIds: ['topic-greetings'],
  },
];

export function isContentPublished(item: { status: ContentStatus }): boolean {
  return item.status === 'published';
}

export function isMediaEligibleForLearner(asset: ReviewedMediaAsset): boolean {
  return (
    asset.status === 'published' &&
    asset.allowLearnerPlayback &&
    Boolean(asset.src) &&
    Boolean(asset.contributorPermissionRef) &&
    Boolean(asset.fslReviewedBy) &&
    Boolean(asset.framingCheckedBy) &&
    asset.mirrored === false
  );
}

export function queryEligibleConcepts(
  records: ConceptRecord[],
  query: string,
  domain: 'All signs' | ConceptRecord['domain']
): ConceptRecord[] {
  const q = query.trim().toLowerCase();
  return records.filter((record) => {
    if (!isContentPublished(record)) return false;
    if (!record.mediaAssets.some(isMediaEligibleForLearner)) return false;
    if (domain !== 'All signs' && record.domain !== domain) return false;
    if (!q) return true;
    const haystack = [
      record.title,
      record.summary,
      ...record.englishAliases,
      ...record.filipinoAliases,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  });
}

export function toggleSavedConcept(savedIds: string[], concept: ConceptRecord): string[] {
  if (!isContentPublished(concept)) return savedIds;
  return savedIds.includes(concept.id)
    ? savedIds.filter((id) => id !== concept.id)
    : [...savedIds, concept.id];
}

export function countDailyPracticeEntries(entries: PracticeLogEntry[], dateIso: string): number {
  return entries.filter((entry) => entry.date === dateIso && entry.evidenceType !== 'viewed').length;
}

export function validateContentIssueDraft(draft: ContentIssueDraft): string | null {
  if (!draft.conceptId.trim()) return 'Select a concept entry before sending feedback.';
  if (!Number.isInteger(draft.contentVersion) || draft.contentVersion < 1) {
    return 'A valid content version is required.';
  }
  const clean = draft.note.trim();
  if (clean.length < 8) return 'Describe what seemed unclear in at least 8 characters.';
  if (clean.length > 500) return 'Keep feedback under 500 characters.';
  return null;
}

