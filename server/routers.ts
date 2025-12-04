import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { processVideoFrame } from "./videoProcessor";
import { cameraProcessingService } from "./cameraProcessingService";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  
  // === AUTENTICACIÓN SIMULADA (MODO DESARROLLO) ===
  auth: router({
    // Simular que siempre hay un usuario Admin conectado
    me: publicProcedure.query(() => ({
      id: 1,
      openId: "admin-dev",
      name: "Administrador Local",
      email: "admin@sistema.local",
      role: "admin" as const, // Importante: rol de admin para ver todo
      loginMethod: "dev",
      lastSignedIn: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  // ===============================================

  // === GESTIÓN DE USUARIOS (ADMINISTRACIÓN) ===
  users: router({
    list: protectedProcedure.query(async () => {
      const { getAllUsers } = await import("./db");
      return await getAllUsers();
    }),
    
    updateRole: protectedProcedure
      .input(z.object({ 
        userId: z.number(), 
        role: z.enum(["admin", "user"]) 
      }))
      .mutation(async ({ input }) => {
        const { updateUserRole } = await import("./db");
        await updateUserRole(input.userId, input.role);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteUser } = await import("./db");
        await deleteUser(input.id);
        return { success: true };
      }),
  }),

  cameras: router({
    list: publicProcedure.query(async () => {
      const { getAllCameras } = await import("./db");
      return await getAllCameras();
    }),
    getById: publicProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "id" in val && typeof val.id === "number") {
          return { id: val.id };
        }
        throw new Error("Invalid input: expected { id: number }");
      })
      .query(async ({ input }) => {
        const { getCameraById } = await import("./db");
        return await getCameraById(input.id);
      }),
    create: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "name" in val && "streamUrl" in val) {
          return val as { 
            name: string; 
            streamUrl: string; 
            location?: string; 
            cameraType?: string;
            roomId?: number;
            username?: string; // Nuevo campo opcional
            password?: string; // Nuevo campo opcional
          };
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ input }) => {
        const { createCamera } = await import("./db");
        return await createCamera(input);
      }),
    update: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "id" in val && typeof val.id === "number") {
          return val as { 
            id: number; 
            name?: string; 
            streamUrl?: string; 
            location?: string; 
            status?: "active" | "inactive" | "error"; 
            cameraType?: string;
            roomId?: number;
            username?: string; // Nuevo campo opcional
            password?: string; // Nuevo campo opcional
          };
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ input }) => {
        const { updateCamera } = await import("./db");
        const { id, ...data } = input;
        await updateCamera(id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "id" in val && typeof val.id === "number") {
          return { id: val.id };
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ input }) => {
        const { deleteCamera } = await import("./db");
        await deleteCamera(input.id);
        return { success: true };
      }),
  }),

  detections: router({
    getByCameraId: publicProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "cameraId" in val && typeof val.cameraId === "number") {
          const limit = "limit" in val && typeof val.limit === "number" ? val.limit : 100;
          return { cameraId: val.cameraId, limit };
        }
        throw new Error("Invalid input");
      })
      .query(async ({ input }) => {
        const { getDetectionsByCameraId } = await import("./db");
        return await getDetectionsByCameraId(input.cameraId, input.limit);
      }),
    create: protectedProcedure
      .input((val: unknown) => {
        if (typeof val === "object" && val !== null && "cameraId" in val && typeof val.cameraId === "number") {
          return val as { cameraId: number; personCount: number; chairCount: number; occupancyRate: number };
        }
        throw new Error("Invalid input");
      })
      .mutation(async ({ input }) => {
        const { createDetection } = await import("./db");
        return await createDetection(input);
      }),
    latest: publicProcedure
      .input((val: unknown) => {
        const limit = typeof val === "object" && val !== null && "limit" in val && typeof val.limit === "number" ? val.limit : 10;
        return { limit };
      })
      .query(async ({ input }) => {
        const { getLatestDetections } = await import("./db");
        return await getLatestDetections(input.limit);
      }),
  }),

  rooms: router({
    list: publicProcedure.query(async () => {
      const { getAllRooms } = await import("./db");
      return await getAllRooms();
    }),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const { getRoomById } = await import("./db");
      return await getRoomById(input.id);
    }),
    create: protectedProcedure.input(z.object({
      name: z.string(),
      location: z.string().optional(),
      capacity: z.number().optional(),
      roomType: z.string().optional(),
      gridRows: z.number().optional(),
      gridCols: z.number().optional(),
    })).mutation(async ({ input }) => {
      const { createRoom } = await import("./db");
      return await createRoom(input);
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      location: z.string().optional(),
      capacity: z.number().optional(),
      roomType: z.string().optional(),
      gridRows: z.number().optional(),
      gridCols: z.number().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...updates } = input;
      const { updateRoom } = await import("./db");
      await updateRoom(id, updates);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const { deleteRoom } = await import("./db");
      await deleteRoom(input.id);
      return { success: true };
    }),
  }),

  logs: router({
    list: protectedProcedure.input(z.object({ limit: z.number().optional() })).query(async ({ input }) => {
      const { getActivityLogs } = await import("./db");
      return await getActivityLogs(input.limit);
    }),
    byUser: protectedProcedure.input(z.object({ userId: z.number(), limit: z.number().optional() })).query(async ({ input }) => {
      const { getActivityLogsByUser } = await import("./db");
      return await getActivityLogsByUser(input.userId, input.limit);
    }),
    create: protectedProcedure.input(z.object({
      userId: z.number().optional(),
      action: z.string(),
      entity: z.string().optional(),
      entityId: z.number().optional(),
      details: z.string().optional(),
      ipAddress: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { createActivityLog } = await import("./db");
      await createActivityLog(input);
      return { success: true };
    }),
  }),

  alerts: router({
    list: publicProcedure.query(async () => {
      const { getAllAlerts } = await import("./db");
      return await getAllAlerts();
    }),
    create: protectedProcedure.input(z.object({
      cameraId: z.number().optional(),
      roomId: z.number().optional(),
      alertType: z.string(),
      threshold: z.number().optional(),
      message: z.string().optional(),
    })).mutation(async ({ input }) => {
      const { createAlert } = await import("./db");
      return await createAlert(input);
    }),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      cameraId: z.number().optional(),
      roomId: z.number().optional(),
      alertType: z.string().optional(),
      threshold: z.number().optional(),
      message: z.string().optional(),
      isActive: z.number().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...updates } = input;
      const { updateAlert } = await import("./db");
      await updateAlert(id, updates);
      return { success: true };
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      const { deleteAlert } = await import("./db");
      await deleteAlert(input.id);
      return { success: true };
    }),
  }),

  // Procesamiento de video en tiempo real
  video: router({
    // Procesar un frame manualmente
    processFrame: protectedProcedure
      .input(z.object({
        cameraId: z.number(),
        useLocalProcessing: z.boolean().default(true),
        apiProvider: z.enum(["google", "aws", "azure"]).optional(),
        confidenceThreshold: z.number().min(0).max(1).default(0.5),
      }))
      .mutation(async ({ input }) => {
        const { getCameraById, createDetection } = await import("./db");
        const camera = await getCameraById(input.cameraId);
        if (!camera) {
          throw new Error("Cámara no encontrada");
        }

        const result = await processVideoFrame(camera.streamUrl, {
          useLocalProcessing: input.useLocalProcessing,
          apiProvider: input.apiProvider,
          confidenceThreshold: input.confidenceThreshold,
        });

        // Registrar detección automáticamente
        await createDetection({
          cameraId: input.cameraId,
          personCount: result.personCount,
          chairCount: result.chairCount,
          occupancyRate: result.occupancyRate,
          timestamp: new Date(),
        });

        return result;
      }),

    // Obtener estado de procesamiento continuo
    getProcessingStatus: publicProcedure
      .input(z.object({ cameraId: z.number() }))
      .query(() => {
        // TODO: Implementar tracking de procesadores activos
        return {
          isProcessing: false,
          lastProcessed: null,
          nextScheduled: null,
        };
      }),

    // Control de procesamiento continuo
    startContinuous: protectedProcedure
      .input(z.object({ cameraId: z.number() }))
      .mutation(async ({ input }) => {
        const { getCameraById } = await import("./db");
        const camera = await getCameraById(input.cameraId);
        if (!camera) {
          throw new Error("Cámara no encontrada");
        }
        // Pasamos credenciales al iniciar la cámara
        await cameraProcessingService.startCamera(
          input.cameraId, 
          camera.streamUrl, 
          60,
          { username: camera.username, password: camera.password }
        );
        return { success: true };
      }),

    stopContinuous: protectedProcedure
      .input(z.object({ cameraId: z.number() }))
      .mutation(({ input }) => {
        cameraProcessingService.stopCamera(input.cameraId);
        return { success: true };
      }),

    startAll: protectedProcedure.mutation(async () => {
      await cameraProcessingService.startAll();
      return { success: true };
    }),

    stopAll: protectedProcedure.mutation(async () => {
      await cameraProcessingService.stopAll();
      return { success: true };
    }),

    getAllStatus: publicProcedure.query(() => {
      return cameraProcessingService.getStatus();
    }),
  }),

  // === GESTIÓN DE HORARIOS ===
  schedules: router({
    getByRoom: protectedProcedure
      .input(z.object({ roomId: z.number() }))
      .query(async ({ input }) => {
        const { getSchedulesByRoom } = await import("./db");
        return await getSchedulesByRoom(input.roomId);
      }),
    create: protectedProcedure
      .input(z.object({
        roomId: z.number(),
        subject: z.string(),
        dayOfWeek: z.number(),
        startTime: z.string(),
        endTime: z.string(),
      }))
      .mutation(async ({ input }) => {
        const { createSchedule } = await import("./db");
        return await createSchedule(input);
      }),
  }),
});

export type AppRouter = typeof appRouter;