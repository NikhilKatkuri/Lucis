import { readFile } from "node:fs/promises";
import { connectDatabase, disconnectDatabase } from "../database/connection.js";
import { ResourceModel, SensorEventModel, WeatherEventModel } from "../database/models.js";
import { ensureDemoData, state } from "../modules/state.js";
import { point } from "../utils/geo.js";
import { logger } from "../utils/logger.js";

function parseCsvLine(line: string): string[] { return line.split(",").map((value) => value.trim()); }

async function seedDataset(): Promise<void> {
  ensureDemoData();
  const file = new URL("../../../data/raw_disaster_snapshots_large.csv", import.meta.url);
  const content = await readFile(file, "utf8");
  const [headerLine, ...lines] = content.split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(headerLine ?? "");
  const records = lines.slice(0, 5_000).map((line) => Object.fromEntries(parseCsvLine(line).map((value, index) => [headers[index] ?? `column_${index}`, value])));
  const weather = records.map((record) => ({ location: point(Number(record.latitude), Number(record.longitude)), temperature: Number(record.temperature), humidity: Number(record.humidity), rainfall: Number(record.rainfall_1h), windSpeed: Number(record.wind_speed), condition: record.hazard ?? "none", timestamp: new Date(record.timestamp ?? Date.now()) }));
  const sensors = records.filter((record) => Number(record.water_level) > 0).map((record) => ({ river: record.zone_id ?? "unknown", waterLevel: Number(record.water_level), threshold: Number(record.water_level) * 1.2, coordinates: point(Number(record.latitude), Number(record.longitude)), timestamp: new Date(record.timestamp ?? Date.now()) }));
  const latest = weather.at(-1);
  if (latest) { state.weather = [{ location: latest.location, temperature: latest.temperature, humidity: latest.humidity, rainfall: latest.rainfall, windSpeed: latest.windSpeed, condition: latest.condition, updatedAt: new Date() }]; }
  const connected = await connectDatabase();
  if (connected) { await WeatherEventModel.deleteMany({}); await SensorEventModel.deleteMany({}); await ResourceModel.deleteMany({}); await WeatherEventModel.insertMany(weather); await SensorEventModel.insertMany(sensors); await ResourceModel.insertMany(state.resources); }
  logger.info({ records: records.length, weather: weather.length, sensors: sensors.length, resources: state.resources.length, connected }, "Lucis datasets seeded");
  await disconnectDatabase();
}

await seedDataset();
