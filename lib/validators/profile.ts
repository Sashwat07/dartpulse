import { z } from "zod";

export const completeProfileSchema = z.object({
  displayName: z.string().trim().min(1, "Display name is required").max(80),
  avatarColor: z.string().trim().min(1, "Color is required"),
});

export const updateLinkedPlayerColorSchema = z.object({
  avatarColor: z.string().trim().min(1, "Color is required"),
});
