import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-rooms",
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

describe("rooms router", () => {
  it("should list all rooms (public access)", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const rooms = await caller.rooms.list();
    
    expect(Array.isArray(rooms)).toBe(true);
  });

  it("should create a new room (authenticated)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const newRoom = await caller.rooms.create({
      name: "Test Room",
      location: "Building A, Floor 2",
      capacity: 30,
      roomType: "Classroom",
      gridRows: 5,
      gridCols: 6,
    });

    expect(newRoom).toBeDefined();
    expect(newRoom.name).toBe("Test Room");
    expect(newRoom.capacity).toBe(30);
  });

  it("should get room by id (public access)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create a room
    const newRoom = await caller.rooms.create({
      name: "Test Room for Get",
      location: "Building B",
      capacity: 25,
    });

    // Then retrieve it
    const publicCaller = appRouter.createCaller(createPublicContext().ctx);
    const room = await publicCaller.rooms.getById({ id: newRoom.id });

    expect(room).toBeDefined();
    expect(room?.id).toBe(newRoom.id);
    expect(room?.name).toBe("Test Room for Get");
  });

  it("should update room (authenticated)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a room
    const newRoom = await caller.rooms.create({
      name: "Room to Update",
      location: "Building C",
      capacity: 20,
    });

    // Update it
    const result = await caller.rooms.update({
      id: newRoom.id,
      name: "Updated Room Name",
      capacity: 35,
    });

    expect(result.success).toBe(true);

    // Verify the update
    const updatedRoom = await caller.rooms.getById({ id: newRoom.id });
    expect(updatedRoom?.name).toBe("Updated Room Name");
    expect(updatedRoom?.capacity).toBe(35);
  });

  it("should delete room (authenticated)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create a room
    const newRoom = await caller.rooms.create({
      name: "Room to Delete",
      location: "Building D",
    });

    // Delete it
    const result = await caller.rooms.delete({ id: newRoom.id });
    expect(result.success).toBe(true);

    // Verify deletion (room should be marked as inactive)
    const deletedRoom = await caller.rooms.getById({ id: newRoom.id });
    // Room is soft-deleted, so it still exists but isActive = 0
    // The list query filters by isActive, so it won't appear in the list
    const allRooms = await caller.rooms.list();
    const foundInList = allRooms.find(r => r.id === newRoom.id);
    expect(foundInList).toBeUndefined();
  });
});
