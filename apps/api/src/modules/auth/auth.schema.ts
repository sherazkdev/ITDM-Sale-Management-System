import { z } from "zod";

export const loginBodySchema = z.object({
  username: z.string().min(1).max(128),
  password: z.string().min(1).max(256),
});
