import { connectDatabase } from "../database/connection.js";
import { ensureDemoData } from "../modules/state.js";
import { startSimulation } from "../modules/simulation/simulation.service.js";
import { logger } from "../utils/logger.js";

ensureDemoData(); await connectDatabase(); startSimulation(process.argv[2] ?? "FLOOD"); logger.info("Simulation started; run the API separately to receive Socket.IO events");
setInterval(() => undefined, 60_000);
