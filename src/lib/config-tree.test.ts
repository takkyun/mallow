import { describe, expect, it } from 'vitest';
import {
  AUTO_EXPAND_DEPTH,
  BRANCH_INITIAL,
  BRANCH_STEP,
  FORCE_EXPAND_MAX_DEPTH,
  initialBranchOpen,
  nextVisibleCount,
} from './config-tree';

describe('initialBranchOpen', () => {
  it('collapse all keeps every branch closed', () => {
    expect(initialBranchOpen(false, 0)).toBe(false);
    expect(initialBranchOpen(false, FORCE_EXPAND_MAX_DEPTH + 5)).toBe(false);
  });

  it('default view opens only the top levels', () => {
    expect(initialBranchOpen(undefined, AUTO_EXPAND_DEPTH - 1)).toBe(true);
    expect(initialBranchOpen(undefined, AUTO_EXPAND_DEPTH)).toBe(false);
    expect(initialBranchOpen(undefined, AUTO_EXPAND_DEPTH + 5)).toBe(false);
  });

  it('expand all opens down to a bounded depth, not infinitely', () => {
    expect(initialBranchOpen(true, 0)).toBe(true);
    expect(initialBranchOpen(true, FORCE_EXPAND_MAX_DEPTH - 1)).toBe(true);
    expect(initialBranchOpen(true, FORCE_EXPAND_MAX_DEPTH)).toBe(false);
    expect(initialBranchOpen(true, FORCE_EXPAND_MAX_DEPTH + 10)).toBe(false);
  });
});

describe('nextVisibleCount', () => {
  it('advances by the default step but never past the total', () => {
    expect(nextVisibleCount(BRANCH_INITIAL, 20_000)).toBe(BRANCH_INITIAL + BRANCH_STEP);
    expect(nextVisibleCount(100, 150)).toBe(150);
    expect(nextVisibleCount(100, 100)).toBe(100);
  });

  it('never exceeds the total even when already at it', () => {
    expect(nextVisibleCount(20_000, 20_000)).toBe(20_000);
  });

  it('accepts a custom step', () => {
    expect(nextVisibleCount(0, 10, 5)).toBe(5);
    expect(nextVisibleCount(8, 10, 5)).toBe(10);
  });
});
