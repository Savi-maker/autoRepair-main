import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";
import { initDb } from "./dbInit.js";
import { seedIfNeeded } from "./seedIfNeeded.js";

await initDb();
await seedIfNeeded();

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

