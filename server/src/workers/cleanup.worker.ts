import { state } from "../modules/state.js";
export const runCleanupWorker = () => { for (const [id, alert] of state.alerts) if (alert.expiresAt < new Date()) state.alerts.delete(id); };
