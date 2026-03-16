import type { MatchStatePayload } from "@/types/dto";
import { useMatchStore } from "@/store/useMatchStore";

// Phase 1 placeholders. Prefer calling store actions directly from the hook in real code.
export const matchActions = {
  addThrow: (score: number) => useMatchStore.getState().addThrow(score),
  undoLastThrow: () => useMatchStore.getState().undoLastThrow(),
  advanceRound: () => useMatchStore.getState().advanceRound(),
  generatePlayoffs: () => useMatchStore.getState().generatePlayoffs(),
  setMatchState: (payload: MatchStatePayload) => useMatchStore.getState().setMatchState(payload),
} as const;

