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
  /** Set when this row is the linked in-game identity for a User (1:1). */
  userId?: string;
  /**
   * Linked players must complete profile in-app; manual players behave as complete.
   * When absent in DB (legacy), treated as true.
   */
  profileCompleted?: boolean;
};
