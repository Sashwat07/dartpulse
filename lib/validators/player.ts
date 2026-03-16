import { z } from "zod";

export const playerSchema = z.object({
  playerId: z.string(),
  name: z.string().min(1),
  avatarColor: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
  avatarUrl: z.string().optional(),
  status: z.string().optional(),
});

export const createPlayerPayloadSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  avatarColor: z.string().trim().optional(),
});

export type CreatePlayerPayloadInput = z.infer<typeof createPlayerPayloadSchema>;
