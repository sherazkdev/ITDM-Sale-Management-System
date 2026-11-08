import type { Request, Response } from "express";
import type { z } from "zod";
import multer from "multer";
import { asyncHandler } from "../../shared/http/async-handler.js";
import { sendSuccess } from "../../shared/http/response.js";
import { getRequestId } from "../../shared/middleware/request-id.js";
import { toPublicJson } from "../../shared/json/serialize.js";
import type { changePasswordSchema, updateProfileSchema } from "./user-profile.schema.js";
import type { UserProfileService } from "./user-profile.service.js";

type UpdateBody = z.infer<typeof updateProfileSchema>;
type PasswordBody = z.infer<typeof changePasswordSchema>;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 1 },
});

export class UserProfileController {
  constructor(private readonly service: UserProfileService) {}

  getMe = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.service.getProfile(req.principal!.userId);
    sendSuccess(res, toPublicJson(data), { requestId: getRequestId(req) });
  });

  patchMe = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.service.updateProfile(
      req.principal!.userId,
      req.body as UpdateBody,
      getRequestId(req),
    );
    sendSuccess(res, toPublicJson(data), { requestId: getRequestId(req) });
  });

  changePassword = asyncHandler(async (req: Request, res: Response) => {
    const data = await this.service.changePassword(
      req.principal!.userId,
      req.body as PasswordBody,
      getRequestId(req),
    );
    sendSuccess(res, data, { requestId: getRequestId(req) });
  });

  uploadAvatar = [
    upload.single("avatar"),
    asyncHandler(async (req: Request, res: Response) => {
      const file = req.file;
      if (!file?.buffer) {
        res.status(422).json({ success: false, error: { message: "Missing avatar file" } });
        return;
      }
      const data = await this.service.uploadAvatar(
        req.principal!.userId,
        file.buffer,
        file.mimetype,
        getRequestId(req),
      );
      sendSuccess(res, data, { requestId: getRequestId(req) });
    }),
  ];

  getAvatar = asyncHandler(async (req: Request, res: Response) => {
    const { buffer, mimeType } = await this.service.readAvatar(req.principal!.userId);
    res.setHeader("Content-Type", mimeType);
    res.setHeader("Cache-Control", "private, max-age=300");
    res.send(buffer);
  });
}
