import { activeAlerts } from "../modules/alerts/alerts.service.js";
export const runAlertWorker = () => activeAlerts();
