import { startServer } from "./server.js";

startServer().catch((err: unknown) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
