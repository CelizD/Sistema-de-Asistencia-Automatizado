import { CameraProcessor } from "./videoProcessor";
import { getAllCameras, createDetection, createActivityLog } from "./db";

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
        await this.startCamera(camera.id, camera.streamUrl, 60); // Intervalo por defecto: 60 segundos
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
    intervalSeconds: number = 60
  ): Promise<void> {
    if (this.processors.has(cameraId)) {
      console.log(`[CameraProcessingService] Cámara ${cameraId} ya está procesando`);
      return;
    }

    const processor = new CameraProcessor(
      cameraId,
      streamUrl,
      intervalSeconds,
      {
        useLocalProcessing: true,
        confidenceThreshold: 0.5,
      }
    );

    await processor.start(async (result) => {
      try {
        // Guardar detección
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

        // Registrar en logs
        await createActivityLog({
          action: "detection",
          entity: "camera",
          entityId: cameraId,
          details: `Detección automática: ${result.personCount} personas, ${result.chairCount} sillas`,
          userId: null,
        });
      } catch (error) {
        console.error(`[CameraProcessingService] Error guardando detección:`, error);
      }
    });

    this.processors.set(cameraId, processor);
    console.log(`[CameraProcessingService] Cámara ${cameraId} iniciada (intervalo: ${intervalSeconds}s)`);
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
   * Reinicia el procesamiento de una cámara (útil cuando cambia configuración)
   */
  async restartCamera(cameraId: number, streamUrl: string, intervalSeconds: number): Promise<void> {
    this.stopCamera(cameraId);
    await this.startCamera(cameraId, streamUrl, intervalSeconds);
  }
}

// Singleton instance
export const cameraProcessingService = new CameraProcessingService();

// Auto-iniciar cuando el servidor arranca (opcional)
// Comentado por defecto - descomentar para auto-inicio
// setTimeout(() => {
//   cameraProcessingService.startAll().catch(console.error);
// }, 5000); // Esperar 5 segundos después del inicio del servidor
