import { state } from "../state.js";
export const analytics = () => ({ ...state.analytics, websocketConnections: state.analytics.websocketConnections });
