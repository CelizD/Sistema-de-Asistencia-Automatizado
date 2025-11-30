import { spawn } from "child_process";
import { storagePut } from "./storage";
import { ENV } from "./_core/env";

export interface DetectionResult {
  personCount: number;
  chairCount: number;
  occupancyRate: number;
  confidence: number;
  processedImageUrl?: string;
  detections: Array<{
    class: string;
    confidence: number;
    bbox: { x: number; y: number; width: number; height: number };
  }>;
}

export interface VideoProcessorConfig {
  useLocalProcessing: boolean;
  apiProvider?: "google" | "aws" | "azure";
  confidenceThreshold: number;
}

/**
 * Procesa un frame de video y detecta personas y sillas
 */
export async function processVideoFrame(
  streamUrl: string,
  config: VideoProcessorConfig = {
    useLocalProcessing: true,
    confidenceThreshold: 0.5,
  }
): Promise<DetectionResult> {
  if (config.useLocalProcessing) {
    return await processFrameLocally(streamUrl, config.confidenceThreshold);
  } else {
    return await processFrameWithAPI(streamUrl, config.apiProvider || "google");
  }
}

/**
 * Captura un frame del stream de video
 */
async function captureFrame(streamUrl: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const frames: Buffer[] = [];
    
    // Usar ffmpeg para capturar un frame
    const ffmpeg = spawn("ffmpeg", [
      "-i", streamUrl,
      "-frames:v", "1",
      "-f", "image2pipe",
      "-vcodec", "png",
      "-"
    ]);

    ffmpeg.stdout.on("data", (data) => {
      frames.push(data);
    });

    ffmpeg.stderr.on("data", (data) => {
      // Log de ffmpeg (verbose)
      console.log(`[FFmpeg]: ${data.toString()}`);
    });

    ffmpeg.on("close", (code) => {
      if (code === 0 && frames.length > 0) {
        resolve(Buffer.concat(frames));
      } else {
        reject(new Error(`FFmpeg exited with code ${code}`));
      }
    });

    ffmpeg.on("error", (err) => {
      reject(err);
    });

    // Timeout de 10 segundos
    setTimeout(() => {
      ffmpeg.kill();
      reject(new Error("Frame capture timeout"));
    }, 10000);
  });
}

/**
 * Procesa frame usando modelo local (YOLO)
 */
async function processFrameLocally(
  streamUrl: string,
  confidenceThreshold: number
): Promise<DetectionResult> {
  try {
    // Capturar frame del stream
    const frameBuffer = await captureFrame(streamUrl);
    
    // Guardar frame temporalmente
    const timestamp = Date.now();
    const framePath = `/tmp/frame_${timestamp}.png`;
    const fs = await import("fs/promises");
    await fs.writeFile(framePath, frameBuffer);

    // Ejecutar detección con Python script
    const result = await runPythonDetection(framePath, confidenceThreshold);
    
    // Limpiar archivo temporal
    await fs.unlink(framePath).catch(() => {});
    
    return result;
  } catch (error) {
    console.error("[VideoProcessor] Error en procesamiento local:", error);
    
    // Fallback: retornar detección simulada
    return {
      personCount: 0,
      chairCount: 0,
      occupancyRate: 0,
      confidence: 0,
      detections: [],
    };
  }
}

/**
 * Ejecuta script de Python para detección de objetos
 */
async function runPythonDetection(
  imagePath: string,
  confidenceThreshold: number
): Promise<DetectionResult> {
  return new Promise((resolve, reject) => {
    const python = spawn("python3", [
      "/home/ubuntu/cam_ip_system/scripts/detect_objects.py",
      imagePath,
      confidenceThreshold.toString(),
    ]);

    let output = "";
    let errorOutput = "";

    python.stdout.on("data", (data) => {
      output += data.toString();
    });

    python.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    python.on("close", (code) => {
      if (code === 0) {
        try {
          const result = JSON.parse(output);
          resolve(result);
        } catch (err) {
          reject(new Error(`Failed to parse Python output: ${output}`));
        }
      } else {
        reject(new Error(`Python script failed: ${errorOutput}`));
      }
    });

    python.on("error", (err) => {
      reject(err);
    });

    // Timeout de 30 segundos
    setTimeout(() => {
      python.kill();
      reject(new Error("Python detection timeout"));
    }, 30000);
  });
}

/**
 * Procesa frame usando API de terceros
 */
async function processFrameWithAPI(
  streamUrl: string,
  provider: "google" | "aws" | "azure"
): Promise<DetectionResult> {
  try {
    // Capturar frame
    const frameBuffer = await captureFrame(streamUrl);
    
    // Subir a S3 para que la API pueda accederlo
    const timestamp = Date.now();
    const { url: imageUrl } = await storagePut(
      `detection-frames/${timestamp}.png`,
      frameBuffer,
      "image/png"
    );

    switch (provider) {
      case "google":
        return await processWithGoogleVision(imageUrl);
      case "aws":
        return await processWithAWSRekognition(imageUrl);
      case "azure":
        return await processWithAzureVision(imageUrl);
      default:
        throw new Error(`Unknown provider: ${provider}`);
    }
  } catch (error) {
    console.error(`[VideoProcessor] Error con API ${provider}:`, error);
    return {
      personCount: 0,
      chairCount: 0,
      occupancyRate: 0,
      confidence: 0,
      detections: [],
    };
  }
}

/**
 * Google Cloud Vision API
 */
async function processWithGoogleVision(imageUrl: string): Promise<DetectionResult> {
  // TODO: Implementar cuando el usuario configure API key
  console.log("[VideoProcessor] Google Vision no configurado aún");
  return {
    personCount: 0,
    chairCount: 0,
    occupancyRate: 0,
    confidence: 0,
    detections: [],
  };
}

/**
 * AWS Rekognition API
 */
async function processWithAWSRekognition(imageUrl: string): Promise<DetectionResult> {
  // TODO: Implementar cuando el usuario configure credenciales AWS
  console.log("[VideoProcessor] AWS Rekognition no configurado aún");
  return {
    personCount: 0,
    chairCount: 0,
    occupancyRate: 0,
    confidence: 0,
    detections: [],
  };
}

/**
 * Azure Computer Vision API
 */
async function processWithAzureVision(imageUrl: string): Promise<DetectionResult> {
  // TODO: Implementar cuando el usuario configure Azure key
  console.log("[VideoProcessor] Azure Vision no configurado aún");
  return {
    personCount: 0,
    chairCount: 0,
    occupancyRate: 0,
    confidence: 0,
    detections: [],
  };
}

/**
 * Inicia procesamiento continuo de una cámara
 */
export class CameraProcessor {
  private intervalId: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(
    private cameraId: number,
    private streamUrl: string,
    private intervalSeconds: number = 60,
    private config: VideoProcessorConfig = {
      useLocalProcessing: true,
      confidenceThreshold: 0.5,
    }
  ) {}

  async start(
    onDetection: (result: DetectionResult) => Promise<void>
  ): Promise<void> {
    if (this.intervalId) {
      console.log(`[CameraProcessor] Cámara ${this.cameraId} ya está procesando`);
      return;
    }

    console.log(`[CameraProcessor] Iniciando procesamiento de cámara ${this.cameraId}`);

    // Procesar inmediatamente
    await this.processFrame(onDetection);

    // Luego procesar cada intervalo
    this.intervalId = setInterval(async () => {
      await this.processFrame(onDetection);
    }, this.intervalSeconds * 1000);
  }

  private async processFrame(
    onDetection: (result: DetectionResult) => Promise<void>
  ): Promise<void> {
    if (this.isProcessing) {
      console.log(`[CameraProcessor] Cámara ${this.cameraId} aún procesando frame anterior`);
      return;
    }

    this.isProcessing = true;

    try {
      const result = await processVideoFrame(this.streamUrl, this.config);
      await onDetection(result);
    } catch (error) {
      console.error(`[CameraProcessor] Error procesando cámara ${this.cameraId}:`, error);
    } finally {
      this.isProcessing = false;
    }
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log(`[CameraProcessor] Detenido procesamiento de cámara ${this.cameraId}`);
    }
  }

  isRunning(): boolean {
    return this.intervalId !== null;
  }
}
