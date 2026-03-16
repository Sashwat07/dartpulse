import type { PlayoffMatch } from "@/types/playoff";
import {
  deletePlayoffMatch,
  getPlayoffMatchById,
  listPlayoffMatchesByParentMatch,
  listThrowEventsByPlayoffMatch,
  resetPlayoffMatchToActive,
  undoLastPlayoffThrow,
} from "@/lib/repositories";

function byStage(allMatches: PlayoffMatch[], stage: PlayoffMatch["stage"]) {
  return allMatches.find((m) => m.stage === stage) ?? null;
}

/**
 * Returns the downstream chain used for blocking: if any match in this list has throws, undo is blocked.
 * Q1 → [Q2]; Q2 → [Eliminator, Final]; Eliminator → [Final]; Final → [].
 * Order: immediate next to furthest (so we can delete in reverse).
 */
export function getDownstreamForBlocking(
  allMatches: PlayoffMatch[],
  currentPlayoffMatchId: string,
): PlayoffMatch[] {
  const current = allMatches.find((m) => m.playoffMatchId === currentPlayoffMatchId);
  if (!current) return [];

  const stage = current.stage;
  if (stage === "qualifier1") {
    const q2 = byStage(allMatches, "qualifier2");
    return q2 ? [q2] : [];
  }
  if (stage === "qualifier2") {
    const elim = byStage(allMatches, "eliminator");
    const fin = byStage(allMatches, "final");
    const out: PlayoffMatch[] = [];
    if (elim) out.push(elim);
    if (fin) out.push(fin);
    return out;
  }
  if (stage === "eliminator") {
    const fin = byStage(allMatches, "final");
    return fin ? [fin] : [];
  }
  return [];
}

/**
 * Returns the full downstream derived chain to delete after undo (cascading reconciliation).
 * All of these will have been verified 0 throws before undo was allowed.
 * Q1 → [Eliminator, Final]; Q2 → [Eliminator, Final]; Eliminator → [Final]; Final → [].
 * Order: immediate next to furthest so we delete in reverse (furthest first).
 */
export function getDownstreamForReconcile(
  allMatches: PlayoffMatch[],
  currentPlayoffMatchId: string,
): PlayoffMatch[] {
  const current = allMatches.find((m) => m.playoffMatchId === currentPlayoffMatchId);
  if (!current) return [];

  const stage = current.stage;
  if (stage === "qualifier1" || stage === "qualifier2") {
    const elim = byStage(allMatches, "eliminator");
    const fin = byStage(allMatches, "final");
    const out: PlayoffMatch[] = [];
    if (elim) out.push(elim);
    if (fin) out.push(fin);
    return out;
  }
  if (stage === "eliminator") {
    const fin = byStage(allMatches, "final");
    return fin ? [fin] : [];
  }
  return [];
}

export type UndoPlayoffThrowResult =
  | { allowed: true }
  | { allowed: false; reason: "no_throw" }
  | { allowed: false; reason: "downstream_has_throws" }
  | { allowed: false; reason: "final_confirmed" }
  | { allowed: false; reason: "match_not_found" }
  | { allowed: false; reason: "wrong_parent" };

/**
 * Server-authoritative playoff undo. Validates downstream chain: if any downstream match has throws, blocks.
 * On success: deletes last throw, reopens current match if completed, then cascades deletion of all downstream
 * derived matches (they have 0 throws; delete in reverse order so furthest first).
 */
export async function undoPlayoffThrow(
  parentMatchId: string,
  playoffMatchId: string,
): Promise<UndoPlayoffThrowResult> {
  const current = await getPlayoffMatchById(playoffMatchId);
  if (!current) return { allowed: false, reason: "match_not_found" };
  if (current.parentMatchId !== parentMatchId)
    return { allowed: false, reason: "wrong_parent" };
  if (current.stage === "final" && current.status === "completed")
    return { allowed: false, reason: "final_confirmed" };

  const allMatches = await listPlayoffMatchesByParentMatch(parentMatchId);
  const forBlocking = getDownstreamForBlocking(allMatches, playoffMatchId);

  for (const match of forBlocking) {
    const throws = await listThrowEventsByPlayoffMatch(match.playoffMatchId);
    if (throws.length > 0) return { allowed: false, reason: "downstream_has_throws" };
  }

  const undoResult = await undoLastPlayoffThrow(playoffMatchId);
  if (!undoResult.success) return { allowed: false, reason: "no_throw" };

  const updatedCurrent = await getPlayoffMatchById(playoffMatchId);
  if (
    updatedCurrent?.status === "completed" ||
    updatedCurrent?.status === "provisionalCompleted"
  ) {
    await resetPlayoffMatchToActive(playoffMatchId);
  }

  const toReconcile = getDownstreamForReconcile(allMatches, playoffMatchId);
  for (let i = toReconcile.length - 1; i >= 0; i--) {
    await deletePlayoffMatch(toReconcile[i].playoffMatchId);
  }

  return { allowed: true };
}
