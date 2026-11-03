import { describe, it, beforeAll } from "vitest";
import request from "supertest";
import { buildApplication } from "../../src/server.js";
import { prepareTestDatabase } from "../helpers/prepare-test-database.js";
import { loginAsAdmin, sessionRequestHeaders } from "../helpers/auth-test.js";

describe("Document upload validation", () => {
  beforeAll(async () => {
    await prepareTestDatabase();
  }, 120_000);

  it("rejects executable MIME at storage layer via API", async () => {
    const app = buildApplication().app;
    const cookie = await loginAsAdmin(app);
    const contentBase64 = Buffer.from("fake").toString("base64");

    await request(app)
      .post("/api/v1/documents/uploads")
      .set(sessionRequestHeaders(cookie))
      .send({
        ownerType: "invoice",
        ownerId: "99",
        originalFileName: "malware.exe",
        mimeType: "application/x-msdownload",
        contentBase64,
      })
      .expect(422);
  });
});
