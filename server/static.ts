import express, { type Express, type Request, type Response } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Hashed assets (JS/CSS/images with content hashes) can be cached forever
  app.use("/assets", express.static(path.join(distPath, "assets"), {
    maxAge: "1y",
    immutable: true,
  }));

  // All other static files (favicon, manifest, sw.js, etc.) — short cache
  app.use(express.static(distPath, { maxAge: "1h" }));

  // index.html must NEVER be cached by CDN or browser so new deploys show immediately
  app.use("*", (_req: Request, res: Response) => {
    res.set({
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    });
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
