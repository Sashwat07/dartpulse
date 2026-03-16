import type { IsoDateString } from "@/types/common";

/**
 * Persistent game participant (entity-model §5).
 * camelCase only.
 */
export type Player = {
  playerId: string;
  name: string;
  avatarColor?: string;
  createdAt: IsoDateString;
  updatedAt: IsoDateString;
  avatarUrl?: string;
  status?: string;
};
