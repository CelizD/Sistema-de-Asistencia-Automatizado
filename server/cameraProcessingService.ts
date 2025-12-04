import { CameraProcessor } from "./videoProcessor";
import { 
  getAllCameras, 
  createDetection, 
  createActivityLog,
  getCameraById,           
  getActiveAlertsForContext, 
  triggerAlertUpdate       
} from "./db";

/**
 * Servicio para gestionar el procesamiento continuo de cámaras
 */
class CameraProcessingService {
  private processors: Map<number, CameraProcessor> = new Map();
  private isRunning = false;

  /**
   * Inicia el procesamiento continuo de todas las cámaras activas
   */
  async startAll(): Promise<void> {
    if (this.isRunning) {
      console.log("[CameraProcessingService] Ya está en ejecución");
      return;
    }

    this.isRunning = true;
    console.log("[CameraProcessingService] Iniciando procesamiento continuo");

    try {
      const cameras = await getAllCameras();
      const activeCameras = cameras.filter(c => c.status === "active");

      console.log(`[CameraProcessingService] Encontradas ${activeCameras.length} cámaras activas`);

      for (const camera of activeCameras) {
        // Pasamos credenciales si existen en la base de datos
        await this.startCamera(
          camera.id, 
          camera.streamUrl, 
          60, 
          { username: camera.username, password: camera.password }
        );
      }

      await createActivityLog({
        action: "system_start",
        details: `Procesamiento continuo iniciado para ${activeCameras.length} cámaras`,
        userId: null,
      });
    } catch (error) {
      console.error("[CameraProcessingService] Error al iniciar:", error);
      this.isRunning = false;
    }
  }

  /**
   * Inicia el procesamiento de una cámara específica
   */
  async startCamera(
    cameraId: number,
    streamUrl: string,
    intervalSeconds: number = 60,
    credentials?: { username?: string | null; password?: string | null }
  ): Promise<void> {
    if (this.processors.has(cameraId)) {
      console.log(`[CameraProcessingService] Cámara ${cameraId} ya está procesando`);
      return;
    }

    // === LÓGICA DE CREDENCIALES ===
    // Si hay usuario y contraseña, construimos la URL con autenticación
    let finalUrl = streamUrl;
    if (credentials?.username && credentials?.password) {
      try {
        // Separa el protocolo (rtsp://) del resto
        const parts = streamUrl.split("://");
        if (parts.length === 2) {
          // Inserta user:pass@ después del protocolo
          finalUrl = `${parts[0]}://${credentials.username}:${credentials.password}@${parts[1]}`;
        }
      } catch (e) {
        console.warn(`[CameraProcessingService] Error construyendo URL segura para cámara ${cameraId}`);
      }
    }
    // ==============================

    const processor = new CameraProcessor(
      cameraId,
      finalUrl, // Usamos la URL modificada
      intervalSeconds,
      {
        useLocalProcessing: true,
        confidenceThreshold: 0.5,
      }
    );

    await processor.start(async (result) => {
      try {
        // 1. Guardar detección en base de datos
        await createDetection({
          cameraId,
          personCount: result.personCount,
          chairCount: result.chairCount,
          occupancyRate: result.occupancyRate,
          timestamp: new Date(),
        });

        console.log(
          `[CameraProcessingService] Cámara ${cameraId}: ${result.personCount} personas, ${result.chairCount} sillas (${result.occupancyRate}%)`
        );

        // 2. === LÓGICA DE EVALUACIÓN DE ALERTAS ===
        
        // Obtener contexto de la cámara (para saber su sala)
        const camera = await getCameraById(cameraId);
        const roomId = camera?.roomId || null;

        // Obtener alertas configuradas
        const activeAlerts = await getActiveAlertsForContext(cameraId, roomId);

        for (const alert of activeAlerts) {
          let shouldTrigger = false;

          // Regla: Ocupación Alta
          if (alert.alertType === 'HIGH_OCCUPANCY' && alert.threshold !== null) {
            if (result.occupancyRate >= alert.threshold) {
              shouldTrigger = true;
            }
          }
          
          // Regla: Ocupación Baja
          if (alert.alertType === 'LOW_OCCUPANCY' && alert.threshold !== null) {
            if (result.occupancyRate <= alert.threshold) {
              shouldTrigger = true;
            }
          }

          if (shouldTrigger) {
            // Verificar Cooldown
            const lastTrigger = alert.lastTriggered ? new Date(alert.lastTriggered).getTime() : 0;
            const now = new Date().getTime();
            const minutesSinceLast = (now - lastTrigger) / 1000 / 60;
            const COOLDOWN_MINUTES = 15;

            if (minutesSinceLast > COOLDOWN_MINUTES) {
              const alertMsg = alert.message || `Alerta: ${alert.alertType} detectada`;
              console.warn(`[ALERTA] Cámara ${cameraId}: ${alertMsg}`);
              
              await createActivityLog({
                action: "ALERT_TRIGGERED",
                entity: "camera",
                entityId: cameraId,
                details: `${alertMsg} (Valor actual: ${result.occupancyRate}%, Umbral: ${alert.threshold}%)`,
                userId: null,
              });

              await triggerAlertUpdate(alert.id);
            }
          }
        }
        // ===============================================

      } catch (error) {
        console.error(`[CameraProcessingService] Error en ciclo de procesamiento:`, error);
      }
    });

    this.processors.set(cameraId, processor);
    console.log(`[CameraProcessingService] Cámara ${cameraId} iniciada`);
  }

  /**
   * Detiene el procesamiento de una cámara específica
   */
  stopCamera(cameraId: number): void {
    const processor = this.processors.get(cameraId);
    if (processor) {
      processor.stop();
      this.processors.delete(cameraId);
      console.log(`[CameraProcessingService] Cámara ${cameraId} detenida`);
    }
  }

  /**
   * Detiene el procesamiento de todas las cámaras
   */
  async stopAll(): Promise<void> {
    console.log("[CameraProcessingService] Deteniendo procesamiento continuo");

    this.processors.forEach((processor) => {
      processor.stop();
    });

    this.processors.clear();
    this.isRunning = false;

    await createActivityLog({
      action: "system_stop",
      details: "Procesamiento continuo detenido",
      userId: null,
    });

    console.log("[CameraProcessingService] Procesamiento detenido");
  }

  /**
   * Obtiene el estado de procesamiento de todas las cámaras
   */
  getStatus(): Array<{
    cameraId: number;
    isProcessing: boolean;
  }> {
    const result: Array<{ cameraId: number; isProcessing: boolean }> = [];
    this.processors.forEach((processor, cameraId) => {
      result.push({
        cameraId,
        isProcessing: processor.isRunning(),
      });
    });
    return result;
  }

  /**
   * Verifica si una cámara específica está procesando
   */
  isCameraProcessing(cameraId: number): boolean {
    const processor = this.processors.get(cameraId);
    return processor ? processor.isRunning() : false;
  }

  /**
   * Reinicia el procesamiento de una cámara
   */
  async restartCamera(cameraId: number, streamUrl: string, intervalSeconds: number): Promise<void> {
    this.stopCamera(cameraId);
    await this.startCamera(cameraId, streamUrl, intervalSeconds);
  }
}

// Singleton instance
export const cameraProcessingService = new CameraProcessingService();