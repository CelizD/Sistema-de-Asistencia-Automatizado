import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-logs",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("logs router", () => {
  it("should create activity log (authenticated)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.logs.create({
      userId: 1,
      action: "CREATE",
      entity: "camera",
      entityId: 1,
      details: "Created new camera",
      ipAddress: "192.168.1.1",
    });

    expect(result.success).toBe(true);
  });

  it("should list activity logs (authenticated)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create some logs
    await caller.logs.create({
      userId: 1,
      action: "UPDATE",
      entity: "room",
      entityId: 1,
      details: "Updated room configuration",
    });

    // List logs
    const logs = await caller.logs.list({ limit: 10 });

    expect(Array.isArray(logs)).toBe(true);
    expect(logs.length).toBeGreaterThan(0);
  });

  it("should get logs by user (authenticated)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create log for specific user
    await caller.logs.create({
      userId: 1,
      action: "LOGIN",
      details: "User logged in",
    });

    // Get logs for that user
    const userLogs = await caller.logs.byUser({ userId: 1, limit: 10 });

    expect(Array.isArray(userLogs)).toBe(true);
    expect(userLogs.length).toBeGreaterThan(0);
    expect(userLogs[0]?.userId).toBe(1);
  });
});

describe("alerts router", () => {
  it("should list all alerts (public access)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const alerts = await caller.alerts.list();
    
    expect(Array.isArray(alerts)).toBe(true);
  });

  it("should create alert (authenticated)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const newAlert = await caller.alerts.create({
      cameraId: 1,
      alertType: "HIGH_OCCUPANCY",
      threshold: 80,
      message: "Occupancy exceeded 80%",
    });

    expect(newAlert).toBeDefined();
    expect(newAlert.alertType).toBe("HIGH_OCCUPANCY");
    expect(newAlert.threshold).toBe(80);
  });

  it("should update alert (authenticated)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create alert
    const newAlert = await caller.alerts.create({
      alertType: "LOW_OCCUPANCY",
      threshold: 20,
      message: "Low occupancy detected",
    });

    // Update it
    const result = await caller.alerts.update({
      id: newAlert.id,
      threshold: 25,
      message: "Updated low occupancy threshold",
    });

    expect(result.success).toBe(true);
  });

  it("should delete alert (authenticated)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create alert
    const newAlert = await caller.alerts.create({
      alertType: "TEST_ALERT",
      message: "Test alert to delete",
    });

    // Delete it
    const result = await caller.alerts.delete({ id: newAlert.id });
    expect(result.success).toBe(true);
  });
});
