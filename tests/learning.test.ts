import { describe, expect, it } from 'vitest';
import { levels, completeOrientation, initialProgress, getLevelState, reviewDate, restoreProgress } from '../src/learning';
describe('learning boundaries', () => {
  it('defines 100 levels, 20 checkpoints, and five stage checks', () => {
    expect(levels).toHaveLength(100);
    expect(levels.filter(l => l.checkpoint)).toHaveLength(20);
    expect(levels.filter(l => l.stageCheck)).toHaveLength(5);
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
});
