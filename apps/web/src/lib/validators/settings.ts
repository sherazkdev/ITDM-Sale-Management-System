import { z } from "zod";

export const profileSettingsSchema = z.object({
  displayName: z.string().trim().min(1, "Display name is required").max(255),
  email: z.string().email().max(255).optional().or(z.literal("")),
  profilePhone: z.string().trim().max(64).optional(),
  profileLocation: z.string().trim().max(255).optional(),
  profileBio: z.string().trim().max(4000).optional(),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(1, "Required"),
    newPassword: z.string().min(12, "At least 12 characters").max(128),
    confirmPassword: z.string().min(1, "Required"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export const ACCEPTED_AVATAR_MIME = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export function validateAvatarFile(file: Pick<File, "type" | "size">): string | null {
  if (!ACCEPTED_AVATAR_MIME.includes(file.type as (typeof ACCEPTED_AVATAR_MIME)[number])) {
    return "Use PNG, JPEG, WebP, or GIF.";
  }
  if (file.size > MAX_AVATAR_BYTES) return "Image must be 2 MB or smaller.";
  return null;
}
