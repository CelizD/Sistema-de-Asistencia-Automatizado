# Configuración de Cámaras IP Reales

Este documento explica cómo configurar y conectar cámaras IP reales al Sistema de Asistencia Automatizado.

## Requisitos Previos

### 1. Dependencias de Python (Instalación en Progreso)

El sistema requiere las siguientes bibliotecas de Python para procesamiento de video:

```bash
pip3 install opencv-python-headless numpy ultralytics pillow requests
```

**Estado actual**: La instalación está en progreso. Las bibliotecas son grandes (~2GB) y pueden tardar varios minutos.

**Verificar instalación**:
```bash
python3 -c "import cv2, ultralytics; print('OpenCV:', cv2.__version__); print('Ultralytics OK')"
```

### 2. FFmpeg (Ya Instalado)

FFmpeg se usa para capturar frames de los streams de video.

**Verificar**:
```bash
ffmpeg -version
```

## Formatos de URL Soportados

El sistema soporta los siguientes formatos de streams de cámaras IP:

### RTSP (Recomendado)
```
rtsp://usuario:contraseña@192.168.1.100:554/stream1
rtsp://192.168.1.100:554/h264/ch1/main/av_stream
```

### HTTP/HTTPS
```
http://192.168.1.100:8080/video
https://camara.ejemplo.com/stream.mjpg
```

### RTMP
```
rtmp://192.168.1.100/live/stream1
```

## Configuración Paso a Paso

### 1. Agregar Cámara en el Sistema

1. Accede a **Gestionar Cámaras** en el dashboard
2. Haz clic en **Agregar Cámara**
3. Completa el formulario:
   - **Nombre**: Identificador descriptivo (ej: "Aula 101")
   - **URL del Stream**: URL completa de la cámara
   - **Ubicación**: Ubicación física (ej: "Edificio A - Piso 1")
   - **Tipo**: Tipo de cámara (ej: "IP", "PTZ", "Domo")

### 2. Verificar Conexión

Antes de procesar, verifica que la cámara sea accesible:

```bash
# Probar captura de un frame
ffmpeg -i "rtsp://usuario:pass@192.168.1.100:554/stream" -frames:v 1 test.jpg
```

Si el comando genera `test.jpg`, la cámara está accesible.

### 3. Procesar Video

1. Ve a **Monitoreo en Vivo**
2. Selecciona la cámara configurada
3. Ajusta la configuración:
   - **Procesamiento Local**: Activado (usa YOLO local)
   - **Umbral de Confianza**: 50-70% recomendado
4. Haz clic en **Procesar Frame Ahora**

## Configuración Avanzada

### Procesamiento Continuo Automático

Para habilitar procesamiento automático cada X segundos, puedes usar el `CameraProcessor`:

```typescript
import { CameraProcessor } from "./server/videoProcessor";

const processor = new CameraProcessor(
  cameraId,
  streamUrl,
  60, // Procesar cada 60 segundos
  {
    useLocalProcessing: true,
    confidenceThreshold: 0.5,
  }
);

await processor.start(async (result) => {
  // Guardar detección en base de datos
  await createDetection({
    cameraId,
    personCount: result.personCount,
    chairCount: result.chairCount,
    occupancyRate: result.occupancyRate,
    timestamp: new Date(),
  });
});
```

### Configuración de APIs de Terceros (Opcional)

Si prefieres usar APIs de visión por computadora en lugar de procesamiento local:

#### Google Cloud Vision

1. Crea un proyecto en Google Cloud Console
2. Habilita Vision API
3. Crea credenciales (API Key o Service Account)
4. Configura en el sistema:

```typescript
const result = await processVideoFrame(streamUrl, {
  useLocalProcessing: false,
  apiProvider: "google",
  confidenceThreshold: 0.5,
});
```

#### AWS Rekognition

1. Crea cuenta en AWS
2. Configura credenciales IAM
3. Habilita Rekognition
4. Usa en el sistema:

```typescript
const result = await processVideoFrame(streamUrl, {
  useLocalProcessing: false,
  apiProvider: "aws",
  confidenceThreshold: 0.5,
});
```

#### Azure Computer Vision

1. Crea recurso de Computer Vision en Azure Portal
2. Obtén endpoint y key
3. Configura:

```typescript
const result = await processVideoFrame(streamUrl, {
  useLocalProcessing: false,
  apiProvider: "azure",
  confidenceThreshold: 0.5,
});
```

## Solución de Problemas

### Error: "FFmpeg exited with code 1"

**Causa**: La URL del stream no es accesible o las credenciales son incorrectas.

**Solución**:
- Verifica que la cámara esté encendida y conectada a la red
- Comprueba usuario y contraseña
- Prueba la URL en VLC Media Player

### Error: "Python detection timeout"

**Causa**: El procesamiento está tardando más de 30 segundos.

**Solución**:
- Reduce la resolución del stream de la cámara
- Usa modelo YOLO más pequeño (yolov8n.pt)
- Aumenta el timeout en `videoProcessor.ts`

### Error: "ModuleNotFoundError: No module named 'cv2'"

**Causa**: Las dependencias de Python no están instaladas.

**Solución**:
```bash
pip3 install opencv-python-headless ultralytics
```

### Detecciones Incorrectas

**Causa**: Umbral de confianza muy bajo o condiciones de iluminación pobres.

**Solución**:
- Aumenta el umbral de confianza a 60-70%
- Mejora la iluminación del espacio
- Ajusta el ángulo de la cámara para mejor visibilidad

## Optimización de Rendimiento

### Para Múltiples Cámaras

1. **Procesamiento escalonado**: No proceses todas las cámaras simultáneamente
2. **Intervalos diferentes**: Cámaras de alta prioridad cada 30s, otras cada 2-5 minutos
3. **Horarios específicos**: Solo procesa durante horarios de clase

### Reducir Uso de CPU/GPU

1. Usa modelo YOLO Nano (`yolov8n.pt`) en lugar de modelos más grandes
2. Reduce la resolución de captura en FFmpeg:
   ```bash
   ffmpeg -i <stream> -vf scale=640:480 -frames:v 1 output.jpg
   ```
3. Aumenta el intervalo entre procesamiento

### Almacenamiento

Los frames procesados se guardan en S3. Para controlar el espacio:

1. Configura políticas de retención en S3
2. Guarda solo frames con detecciones significativas
3. Comprime imágenes antes de subir

## Mejores Prácticas

1. **Posicionamiento de Cámaras**:
   - Vista cenital (desde arriba) para mejor conteo
   - Evita contraluz y reflejos
   - Cubre toda el área de interés

2. **Calibración Inicial**:
   - Procesa varios frames manualmente
   - Verifica precisión de detecciones
   - Ajusta umbral de confianza según resultados

3. **Monitoreo**:
   - Revisa logs de actividad regularmente
   - Verifica que las cámaras sigan activas
   - Compara detecciones con conteos manuales

4. **Seguridad**:
   - Usa HTTPS para streams cuando sea posible
   - Cambia credenciales por defecto de las cámaras
   - Mantén las cámaras en red privada

## Próximos Pasos

Una vez configuradas las cámaras reales:

1. **Procesamiento Continuo**: Implementar workers que procesen automáticamente
2. **Alertas en Tiempo Real**: Notificaciones cuando ocupación supere umbrales
3. **Heatmaps Dinámicos**: Vincular detecciones con posiciones específicas en salas
4. **Reportes Automáticos**: Generar reportes diarios/semanales de asistencia
5. **Tracking de Personas**: Seguimiento de individuos entre frames

## Soporte

Para problemas técnicos o preguntas:

1. Revisa los logs del servidor en la consola
2. Verifica el estado de las cámaras en **Gestionar Cámaras**
3. Consulta los logs de actividad del sistema
4. Prueba con una URL de stream de prueba pública primero
