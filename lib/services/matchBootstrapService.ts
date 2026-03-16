import type { CreateMatchPayload } from "@/types/dto";
import type { Match } from "@/types/match";
import type { CreateMatchPayloadWithName } from "@/lib/repositories";
import {
  createMatch,
  createMatchPlayersForMatch,
  createRound,
  getDefaultMatchName,
} from "@/lib/repositories";

function shuffleArray<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Orchestrates match bootstrap: creates Match, MatchPlayers in order, and Round 1.
 * basePlayerOrder is persisted as playerId[] (optionally shuffled).
 * Blank name is replaced with default "Match No. <n>"; backend remains authoritative.
 * createdByUserId is optional and, when provided, is persisted as the owner.
 */
export async function bootstrapMatch(
  data: CreateMatchPayload & { createdByUserId?: string },
): Promise<Match> {
  const trimmedName = (data.name ?? "").trim();
  const defaultName = await getDefaultMatchName();
  const name = trimmedName || defaultName;

  const basePlayerOrder = data.shuffle
    ? shuffleArray([...data.playerIds])
    : data.playerIds;
  const payload: CreateMatchPayloadWithName = {
    ...data,
    name,
    basePlayerOrder,
    shotsPerRound: data.shotsPerRound ?? 1,
    playoffShotsPerRound: data.playoffShotsPerRound,
    createdByUserId: data.createdByUserId,
  };
  const match = await createMatch(payload);
  await createMatchPlayersForMatch(match.matchId, basePlayerOrder);
  await createRound({ matchId: match.matchId, roundNumber: 1 });
  return match;
}
