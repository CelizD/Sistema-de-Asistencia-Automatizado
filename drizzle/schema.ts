import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Tabla de cámaras IP registradas en el sistema
 */
export const cameras = mysqlTable("cameras", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  streamUrl: text("streamUrl").notNull(),
  location: varchar("location", { length: 255 }),
  status: mysqlEnum("status", ["active", "inactive", "error"]).default("active"),
  cameraType: varchar("cameraType", { length: 100 }),
  roomId: int("roomId"), // Vinculación con sala
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Camera = typeof cameras.$inferSelect;
export type InsertCamera = typeof cameras.$inferInsert;

/**
 * Tabla de detecciones realizadas por las cámaras
 */
export const detections = mysqlTable("detections", {
  id: int("id").autoincrement().primaryKey(),
  cameraId: int("cameraId").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  personCount: int("personCount").default(0).notNull(),
  chairCount: int("chairCount").default(0).notNull(),
  occupancyRate: int("occupancyRate").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Detection = typeof detections.$inferSelect;
export type InsertDetection = typeof detections.$inferInsert;

/**
 * Tabla de sesiones de monitoreo
 */
export const monitoringSessions = mysqlTable("monitoring_sessions", {
  id: int("id").autoincrement().primaryKey(),
  cameraId: int("cameraId").notNull(),
  startTime: timestamp("startTime").defaultNow().notNull(),
  endTime: timestamp("endTime"),
  status: mysqlEnum("status", ["active", "completed", "error"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MonitoringSession = typeof monitoringSessions.$inferSelect;
export type InsertMonitoringSession = typeof monitoringSessions.$inferInsert;

/**
 * Tabla de salas/espacios donde se ubican las cámaras
 */
export const rooms = mysqlTable("rooms", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  location: text("location"),
  capacity: int("capacity").default(0),
  roomType: varchar("roomType", { length: 100 }),
  gridRows: int("gridRows").default(5),
  gridCols: int("gridCols").default(5),
  isActive: int("isActive").default(1),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Room = typeof rooms.$inferSelect;
export type InsertRoom = typeof rooms.$inferInsert;

/**
 * Tabla de logs de actividad del sistema
 */
export const activityLogs = mysqlTable("activity_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  action: varchar("action", { length: 100 }).notNull(),
  entity: varchar("entity", { length: 100 }),
  entityId: int("entityId"),
  details: text("details"),
  ipAddress: varchar("ipAddress", { length: 50 }),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;

/**
 * Tabla de alertas configurables
 */
export const alerts = mysqlTable("alerts", {
  id: int("id").autoincrement().primaryKey(),
  cameraId: int("cameraId"),
  roomId: int("roomId"),
  alertType: varchar("alertType", { length: 100 }).notNull(),
  threshold: int("threshold"),
  message: text("message"),
  isActive: int("isActive").default(1),
  lastTriggered: timestamp("lastTriggered"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;