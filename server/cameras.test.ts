import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
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

describe("cameras router", () => {
  it("should list all cameras (public access)", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const cameras = await caller.cameras.list();
    
    expect(Array.isArray(cameras)).toBe(true);
  });

  it("should create a new camera (authenticated)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const newCamera = await caller.cameras.create({
      name: "Test Camera",
      streamUrl: "rtsp://test.example.com/stream",
      location: "Test Location",
      cameraType: "IP",
    });

    expect(newCamera).toBeDefined();
    expect(newCamera.name).toBe("Test Camera");
    expect(newCamera.streamUrl).toBe("rtsp://test.example.com/stream");
  });

  it("should get camera by id (public access)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create a camera
    const newCamera = await caller.cameras.create({
      name: "Test Camera for Get",
      streamUrl: "rtsp://test.example.com/stream2",
      location: "Test Location 2",
    });

    // Then retrieve it
    const publicCaller = appRouter.createCaller(createPublicContext().ctx);
    const camera = await publicCaller.cameras.getById({ id: newCamera.id });

    expect(camera).toBeDefined();
    expect(camera?.id).toBe(newCamera.id);
    expect(camera?.name).toBe("Test Camera for Get");
  });

  it("should update camera (authenticated)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a camera
    const newCamera = await caller.cameras.create({
      name: "Camera to Update",
      streamUrl: "rtsp://test.example.com/stream3",
    });

    // Update it
    const result = await caller.cameras.update({
      id: newCamera.id,
      name: "Updated Camera Name",
      status: "active",
    });

    expect(result.success).toBe(true);

    // Verify the update
    const updatedCamera = await caller.cameras.getById({ id: newCamera.id });
    expect(updatedCamera?.name).toBe("Updated Camera Name");
    expect(updatedCamera?.status).toBe("active");
  });

  it("should delete camera (authenticated)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a camera
    const newCamera = await caller.cameras.create({
      name: "Camera to Delete",
      streamUrl: "rtsp://test.example.com/stream4",
    });

    // Delete it
    const result = await caller.cameras.delete({ id: newCamera.id });
    expect(result.success).toBe(true);

    // Verify deletion
    const deletedCamera = await caller.cameras.getById({ id: newCamera.id });
    expect(deletedCamera).toBeUndefined();
  });
});
