import { desc, eq, or, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  cameras, 
  Camera, 
  InsertCamera, 
  detections, 
  Detection, 
  InsertDetection, 
  monitoringSessions, 
  MonitoringSession, 
  InsertMonitoringSession,
  rooms,
  Room,
  InsertRoom,
  activityLogs,
  ActivityLog,
  InsertActivityLog,
  alerts,
  Alert,
  InsertAlert,
  // === IMPORTACIONES AGREGADAS ===
  schedules,
  Schedule,
  InsertSchedule
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Funciones para gestión de cámaras

export async function getAllCameras(): Promise<Camera[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(cameras).orderBy(desc(cameras.createdAt));
}

export async function getCameraById(id: number): Promise<Camera | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(cameras).where(eq(cameras.id, id)).limit(1);
  return result[0];
}

export async function createCamera(camera: InsertCamera): Promise<Camera> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(cameras).values(camera);
  return await getCameraById(Number(result[0].insertId)) as Camera;
}

export async function updateCamera(id: number, camera: Partial<InsertCamera>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(cameras).set(camera).where(eq(cameras.id, id));
}

export async function deleteCamera(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(cameras).where(eq(cameras.id, id));
}

// Funciones para gestión de detecciones
export async function getDetectionsByCameraId(cameraId: number, limit: number = 100): Promise<Detection[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(detections)
    .where(eq(detections.cameraId, cameraId))
    .orderBy(desc(detections.timestamp))
    .limit(limit);
}

export async function createDetection(detection: InsertDetection): Promise<Detection> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(detections).values(detection);
  const inserted = await db.select().from(detections)
    .where(eq(detections.id, Number(result[0].insertId)))
    .limit(1);
  return inserted[0] as Detection;
}

export async function getLatestDetections(limit: number = 10): Promise<Detection[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(detections)
    .orderBy(desc(detections.timestamp))
    .limit(limit);
}

// Funciones para sesiones de monitoreo
export async function createMonitoringSession(session: InsertMonitoringSession): Promise<MonitoringSession> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(monitoringSessions).values(session);
  const inserted = await db.select().from(monitoringSessions)
    .where(eq(monitoringSessions.id, Number(result[0].insertId)))
    .limit(1);
  return inserted[0] as MonitoringSession;
}

export async function getActiveSessionsByCameraId(cameraId: number): Promise<MonitoringSession[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(monitoringSessions)
    .where(eq(monitoringSessions.cameraId, cameraId))
    .orderBy(desc(monitoringSessions.startTime));
}

// Rooms management
export async function getAllRooms() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(rooms).where(eq(rooms.isActive, 1));
}

export async function getRoomById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(rooms).where(eq(rooms.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createRoom(room: InsertRoom) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(rooms).values(room);
  return { id: Number(result[0].insertId), ...room };
}

export async function updateRoom(id: number, updates: Partial<InsertRoom>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(rooms).set(updates).where(eq(rooms.id, id));
}

export async function deleteRoom(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(rooms).set({ isActive: 0 }).where(eq(rooms.id, id));
}

// Activity Logs
export async function createActivityLog(log: InsertActivityLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(activityLogs).values(log);
}

export async function getActivityLogs(limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(activityLogs).orderBy(desc(activityLogs.timestamp)).limit(limit);
}

export async function getActivityLogsByUser(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(activityLogs).where(eq(activityLogs.userId, userId)).orderBy(desc(activityLogs.timestamp)).limit(limit);
}

// Alerts management
export async function getAllAlerts() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(alerts).where(eq(alerts.isActive, 1));
}

export async function createAlert(alert: InsertAlert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(alerts).values(alert);
  return { id: Number(result[0].insertId), ...alert };
}

export async function updateAlert(id: number, updates: Partial<InsertAlert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(alerts).set(updates).where(eq(alerts.id, id));
}

export async function deleteAlert(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(alerts).set({ isActive: 0 }).where(eq(alerts.id, id));
}

// === ALERTAS EN TIEMPO REAL ===

export async function getActiveAlertsForContext(cameraId: number, roomId: number | null) {
  const db = await getDb();
  if (!db) return [];

  if (roomId) {
    return await db.select().from(alerts).where(
      and(
        eq(alerts.isActive, 1),
        or(eq(alerts.cameraId, cameraId), eq(alerts.roomId, roomId))
      )
    );
  } else {
    return await db.select().from(alerts).where(
      and(eq(alerts.isActive, 1), eq(alerts.cameraId, cameraId))
    );
  }
}

export async function triggerAlertUpdate(alertId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(alerts).set({ lastTriggered: new Date() }).where(eq(alerts.id, alertId));
}

/// === GESTIÓN DE USUARIOS ===
export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, newRole: "admin" | "user") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role: newRole }).where(eq(users.id, userId));
}

export async function deleteUser(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(users).where(eq(users.id, userId));
}

// === GESTIÓN DE HORARIOS ===
export async function getSchedulesByRoom(roomId: number) {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(schedules)
    .where(eq(schedules.roomId, roomId))
    .orderBy(schedules.dayOfWeek, schedules.startTime);
}

export async function createSchedule(schedule: InsertSchedule) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(schedules).values(schedule);
  return { id: Number(result[0].insertId), ...schedule };
}

export async function deleteSchedule(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(schedules).where(eq(schedules.id, id));
}