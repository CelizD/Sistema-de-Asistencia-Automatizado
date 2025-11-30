import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("video processing router", () => {
  it("should have processFrame mutation available", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Verificar que el procedimiento existe
    expect(caller.video.processFrame).toBeDefined();
  });

  it("should have getProcessingStatus query available", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Verificar que el procedimiento existe
    expect(caller.video.getProcessingStatus).toBeDefined();
  });

  it("should return processing status for a camera", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const status = await caller.video.getProcessingStatus({ cameraId: 1 });

    expect(status).toHaveProperty("isProcessing");
    expect(status).toHaveProperty("lastProcessed");
    expect(status).toHaveProperty("nextScheduled");
    expect(typeof status.isProcessing).toBe("boolean");
  });

  it("should have startContinuous mutation available", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.video.startContinuous).toBeDefined();
  });

  it("should have stopContinuous mutation available", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.video.stopContinuous).toBeDefined();
  });

  it("should have startAll mutation available", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.video.startAll).toBeDefined();
  });

  it("should have stopAll mutation available", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    expect(caller.video.stopAll).toBeDefined();
  });

  it("should return all processing status", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const status = await caller.video.getAllStatus();

    expect(Array.isArray(status)).toBe(true);
  });

  // Nota: No probamos processFrame con cámara real porque requiere
  // una URL de stream válida y puede tardar mucho tiempo
});
