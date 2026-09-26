import { calculateRisk } from "../modules/risk/risk.service.js";
export const runRiskWorker = () => calculateRisk();
