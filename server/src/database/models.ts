import { Schema, model } from "mongoose";

const pointSchema = new Schema({ type: { type: String, enum: ["Point"], required: true }, coordinates: { type: [Number], required: true } }, { _id: false });
const polygonSchema = new Schema({ type: { type: String, enum: ["Polygon"], required: true }, coordinates: { type: [[[Number]]], required: true } }, { _id: false });

export const DeviceModel = model("Device", new Schema({ deviceId: { type: String, unique: true, index: true }, socketId: String, language: String, appVersion: String, location: pointSchema, notificationEnabled: Boolean, lastSeen: Date, battery: Number, movementState: String }, { timestamps: true }));
DeviceModel.schema.index({ location: "2dsphere" });
export const WeatherEventModel = model("WeatherEvent", new Schema({ location: pointSchema, temperature: Number, humidity: Number, rainfall: Number, windSpeed: Number, condition: String, timestamp: Date }, { timestamps: true }));
WeatherEventModel.schema.index({ location: "2dsphere" });
export const SatelliteEventModel = model("SatelliteEvent", new Schema({ affectedArea: polygonSchema, confidence: Number, timestamp: Date }, { timestamps: true }));
SatelliteEventModel.schema.index({ affectedArea: "2dsphere" });
export const SensorEventModel = model("SensorEvent", new Schema({ river: String, waterLevel: Number, threshold: Number, coordinates: pointSchema, timestamp: Date }, { timestamps: true }));
SensorEventModel.schema.index({ coordinates: "2dsphere" });
export const RiskZoneModel = model("RiskZone", new Schema({ id: { type: String, unique: true, index: true }, center: pointSchema, radius: Number, polygon: polygonSchema, hazard: String, score: Number, severity: String, confidence: Number, evidence: [Schema.Types.Mixed], updatedAt: Date }, { timestamps: true }));
RiskZoneModel.schema.index({ center: "2dsphere" });
export const AlertModel = model("Alert", new Schema({ id: { type: String, unique: true, index: true }, title: String, type: String, status: String, severity: String, confidence: Number, center: pointSchema, radius: Number, evidence: [Schema.Types.Mixed], expiresAt: Date }, { timestamps: true }));
AlertModel.schema.index({ center: "2dsphere" });
export const ResourceModel = model("Resource", new Schema({ name: String, type: String, location: pointSchema, address: String, capacity: Number, available: Boolean, phone: String }));
ResourceModel.schema.index({ location: "2dsphere" });
export const ReportModel = model("CommunityReport", new Schema({ deviceId: String, location: pointSchema, message: String, timestamp: Date, trustScore: Number, verified: Boolean }, { timestamps: true }));
ReportModel.schema.index({ location: "2dsphere" });
export const SimulationEventModel = model("SimulationEvent", new Schema({ scenario: String, eventType: String, payload: Schema.Types.Mixed, timestamp: Date }));
export const AnalyticsModel = model("Analytics", new Schema({ key: { type: String, unique: true }, value: Schema.Types.Mixed, updatedAt: Date }));
