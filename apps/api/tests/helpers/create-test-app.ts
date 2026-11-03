import type { Express } from "express";
import { buildApplication } from "../../src/server.js";

export function createTestApp(): Express {
  return buildApplication().app;
}
