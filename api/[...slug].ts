/**
 * Vercel catch-all serverless function.
 *
 * Routes ALL /api/* requests to the shared Express app, making every
 * server endpoint available in Vercel production without needing a
 * separately-deployed Express server.
 *
 * In local development, the Vite proxy forwards /api/* to the Express
 * server running at localhost:3001 (started by `bun run dev`), so this
 * file is only used in Vercel deploys.
 */
import { app } from "../server/app";

export default (req: any, res: any) => app(req, res);
