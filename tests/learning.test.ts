import { describe, expect, it } from 'vitest';
import { levels, completeOrientation, initialProgress, getLevelState, reviewDate, restoreProgress, questions } from '../src/learning';
import { parseSoundSetting } from '../src/sound';
import {
  CATALOGUE_TOPICS,
  countDailyPracticeEntries,
  isMediaEligibleForLearner,
  queryEligibleConcepts,
  toggleSavedConcept,
  validateContentIssueDraft,
} from '../src/contentContract';

describe('learning boundaries', () => {
  it('defines 100 levels, 20 checkpoints, and five stage checks', () => {
    expect(levels).toHaveLength(100);
    expect(levels.filter(l => l.checkpoint)).toHaveLength(20);
    expect(levels.filter(l => l.stageCheck)).toHaveLength(5);
    expect(levels.filter(l => l.published).map(l => l.id)).toEqual([1]);
    expect(questions.length).toBeGreaterThanOrEqual(3);
  });
  it('does not unlock unpublished content or award duplicate orientation XP', () => {
    const once = completeOrientation(initialProgress);
    expect(completeOrientation(once).xp).toBe(20);
    expect(getLevelState(levels[1], once)).toBe('upcoming');
    expect(getLevelState(levels[0], once)).toBe('completed');
  });
  it('does not accept forged or malformed saved results', () => {
    expect(restoreProgress('{"xp":999999,"completed":[100]}').xp).toBe(0);
    expect(restoreProgress('broken')).toEqual(initialProgress);
  });
  it('schedules successful reviews in 1, 3, 7, 14 day intervals', () => {
    expect(reviewDate(2, '2026-10-26')).toBe('2026-11-02');
    expect(reviewDate(0, '2026-10-26')).toBe('2026-10-27');
  });
  it('defaults sound effects to muted unless explicitly enabled', () => {
    expect(parseSoundSetting(null)).toBe(false);
    expect(parseSoundSetting('off')).toBe(false);
    expect(parseSoundSetting('unexpected')).toBe(false);
    expect(parseSoundSetting('on')).toBe(true);
  });
});

describe('reviewed content contract and daily practice evidence', () => {
  it('refuses unpublished or unreviewed concept entries and media', () => {
    expect(queryEligibleConcepts(CATALOGUE_TOPICS, '', 'All signs')).toEqual([]);
    expect(
      isMediaEligibleForLearner({
        id: 'm1',
        conceptId: 'topic-greetings',
        contentVersion: 1,
        src: '/video/unreviewed.mp4',
        captionText: 'Test',
        performerCredit: 'Signer',
        contributorPermissionRef: null,
        fslReviewedBy: null,
        framingCheckedBy: 'checker-1',
        allowLearnerPlayback: true,
        allowOfflinePack: false,
        mirrored: false,
        status: 'published',
      })
    ).toBe(false);
    expect(toggleSavedConcept([], CATALOGUE_TOPICS[0])).toEqual([]);
  });

  it('counts dated practice events separately from viewed clips and validates feedback', () => {
    const entries = [
      { date: '2026-11-12', conceptId: 'c1', evidenceType: 'viewed' as const, activityVersion: 1 },
      { date: '2026-11-12', conceptId: 'c1', evidenceType: 'comprehension_result' as const, activityVersion: 1 },
      { date: '2026-11-11', conceptId: 'c1', evidenceType: 'self_practice' as const, activityVersion: 1 },
    ];
    expect(countDailyPracticeEntries(entries, '2026-11-12')).toBe(1);
    expect(validateContentIssueDraft({ conceptId: 'topic-greetings', contentVersion: 1, category: 'clarity', note: 'short' })).toBeTruthy();
    expect(validateContentIssueDraft({ conceptId: 'topic-greetings', contentVersion: 1, category: 'clarity', note: 'Signing hand exited frame at 0:04.' })).toBeNull();
  });
});

it('uses the Asia/Manila day boundary like the database', async () => {
  const { kamayoToday } = await import('../src/learning');
  // 2026-11-13 17:30 UTC is already 2026-11-14 01:30 in Manila; a UTC slice would credit the wrong day.
  expect(kamayoToday(new Date('2026-11-13T17:30:00Z'))).toBe('2026-11-14');
  expect(kamayoToday(new Date('2026-11-13T15:59:00Z'))).toBe('2026-11-13');
});
