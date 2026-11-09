import { z } from "zod";

const EVENT_TYPES = ["CONTRACT_EXPIRY", "LICENSE_EXPIRY", "PO_VALID_UNTIL"] as const;

export const notificationListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    unread: z
      .enum(["true", "false"])
      .optional()
      .transform((v) => (v === "true" ? true : v === "false" ? false : undefined)),
    read: z.enum(["all", "unread", "read"]).optional(),
    expiringSoon: z
      .enum(["true", "false"])
      .optional()
      .transform((v) => v === "true"),
    eventType: z.enum(EVENT_TYPES).optional(),
    search: z.string().trim().max(120).optional(),
    dueFrom: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
    dueTo: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .optional(),
  })
  .transform((q) => {
    let read = q.read ?? "all";
    if (!q.read && q.unread === true) read = "unread";
    return { ...q, read };
  });

export type NotificationListQuery = z.infer<typeof notificationListQuerySchema>;
