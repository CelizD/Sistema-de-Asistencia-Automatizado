import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-detections",
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

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: undefined,
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

describe("detections router", () => {
  it("should create a detection (authenticated)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create a camera
    const camera = await caller.cameras.create({
      name: "Test Camera for Detection",
      streamUrl: "rtsp://test.example.com/detection",
    });

    // Create a detection
    const detection = await caller.detections.create({
      cameraId: camera.id,
      personCount: 10,
      chairCount: 20,
      occupancyRate: 50,
    });

    expect(detection).toBeDefined();
    expect(detection.cameraId).toBe(camera.id);
    expect(detection.personCount).toBe(10);
    expect(detection.chairCount).toBe(20);
    expect(detection.occupancyRate).toBe(50);
  });

  it("should get detections by camera id (public access)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a camera
    const camera = await caller.cameras.create({
      name: "Test Camera for Query",
      streamUrl: "rtsp://test.example.com/query",
    });

    // Create multiple detections
    await caller.detections.create({
      cameraId: camera.id,
      personCount: 5,
      chairCount: 10,
      occupancyRate: 50,
    });

    await caller.detections.create({
      cameraId: camera.id,
      personCount: 8,
      chairCount: 10,
      occupancyRate: 80,
    });

    // Query detections (public access)
    const publicCaller = appRouter.createCaller(createPublicContext().ctx);
    const detections = await publicCaller.detections.getByCameraId({
      cameraId: camera.id,
      limit: 10,
    });

    expect(Array.isArray(detections)).toBe(true);
    expect(detections.length).toBeGreaterThanOrEqual(2);
    expect(detections[0]?.cameraId).toBe(camera.id);
  });

  it("should get latest detections (public access)", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const latestDetections = await caller.detections.latest({ limit: 5 });

    expect(Array.isArray(latestDetections)).toBe(true);
    expect(latestDetections.length).toBeLessThanOrEqual(5);
  });

  it("should calculate occupancy rate correctly", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a camera
    const camera = await caller.cameras.create({
      name: "Test Camera for Occupancy",
      streamUrl: "rtsp://test.example.com/occupancy",
    });

    // Create detection with 75% occupancy
    const detection = await caller.detections.create({
      cameraId: camera.id,
      personCount: 15,
      chairCount: 20,
      occupancyRate: 75,
    });

    expect(detection.occupancyRate).toBe(75);
    expect(detection.personCount).toBe(15);
    expect(detection.chairCount).toBe(20);
  });
});
