import { z } from "zod";

const themeColorsSchema = z.object({
  primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(255).optional(),
  email: z.string().email().max(255).nullable().optional(),
  profilePhone: z.string().max(64).nullable().optional(),
  profileLocation: z.string().max(255).nullable().optional(),
  profileBio: z.string().max(4000).nullable().optional(),
  themePreferences: z
    .object({
      mode: z.enum(["light", "dark", "system"]).optional(),
      colors: themeColorsSchema.optional(),
    })
    .optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1).max(256),
    newPassword: z.string().min(12).max(128),
    confirmPassword: z.string().min(12).max(128),
  })
  .refine((b) => b.newPassword === b.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
