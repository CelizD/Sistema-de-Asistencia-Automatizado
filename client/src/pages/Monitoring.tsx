import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Camera, Users, Armchair, TrendingUp, Play, Loader2, Zap, PlayCircle, StopCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Monitoring() {
  const { isAuthenticated, loading } = useAuth();
  const [selectedCameraId, setSelectedCameraId] = useState<number | null>(null);
  const [useLocalProcessing, setUseLocalProcessing] = useState(true);
  const [confidenceThreshold, setConfidenceThreshold] = useState([0.5]);
  const [lastDetection, setLastDetection] = useState<any>(null);

  const utils = trpc.useUtils();
  const { data: processingStatus } = trpc.video.getAllStatus.useQuery(undefined, {
    refetchInterval: 5000, // Actualizar cada 5 segundos
  });
  const { data: cameras, isLoading: camerasLoading } = trpc.cameras.list.useQuery();
  const { data: detections, isLoading: detectionsLoading } = trpc.detections.getByCameraId.useQuery(
    { cameraId: selectedCameraId!, limit: 10 },
    { enabled: selectedCameraId !== null }
  );

  const startContinuousMutation = trpc.video.startContinuous.useMutation({
    onSuccess: () => {
      utils.video.getAllStatus.invalidate();
      toast.success("Procesamiento continuo iniciado");
    },
    onError: (error) => {
      toast.error("Error al iniciar: " + error.message);
    },
  });

  const stopContinuousMutation = trpc.video.stopContinuous.useMutation({
    onSuccess: () => {
      utils.video.getAllStatus.invalidate();
      toast.success("Procesamiento continuo detenido");
    },
    onError: (error) => {
      toast.error("Error al detener: " + error.message);
    },
  });

  const startAllMutation = trpc.video.startAll.useMutation({
    onSuccess: () => {
      utils.video.getAllStatus.invalidate();
      toast.success("Procesamiento iniciado en todas las cámaras activas");
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  const stopAllMutation = trpc.video.stopAll.useMutation({
    onSuccess: () => {
      utils.video.getAllStatus.invalidate();
      toast.success("Procesamiento detenido en todas las cámaras");
    },
    onError: (error) => {
      toast.error("Error: " + error.message);
    },
  });

  const processFrameMutation = trpc.video.processFrame.useMutation({
    onSuccess: (result) => {
      setLastDetection(result);
      utils.detections.getByCameraId.invalidate();
      utils.detections.latest.invalidate();
      toast.success(`Detección completada: ${result.personCount} personas, ${result.chairCount} sillas`);
    },
    onError: (error) => {
      toast.error("Error al procesar frame: " + error.message);
    },
  });

  if (loading || camerasLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="text-center space-y-4">
          <AlertCircle className="w-16 h-16 mx-auto text-destructive" />
          <h1 className="text-2xl font-bold">Acceso Restringido</h1>
          <p className="text-muted-foreground">Debes iniciar sesión para acceder a esta página</p>
          <Button asChild>
            <a href={getLoginUrl()}>Iniciar Sesión</a>
          </Button>
        </div>
      </div>
    );
  }

  const selectedCamera = cameras?.find(c => c.id === selectedCameraId);
  const isCameraProcessing = processingStatus?.some(s => s.cameraId === selectedCameraId && s.isProcessing) || false;

  const handleProcessFrame = () => {
    if (!selectedCameraId) {
      toast.error("Selecciona una cámara primero");
      return;
    }

    processFrameMutation.mutate({
      cameraId: selectedCameraId,
      useLocalProcessing,
      confidenceThreshold: confidenceThreshold[0],
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monitoreo en Tiempo Real</h1>
          <p className="text-muted-foreground">Procesamiento automático de video con detección de objetos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle>Selección de Cámara</CardTitle>
              <CardDescription>Elige la cámara que deseas procesar</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Select
                  value={selectedCameraId?.toString() || ""}
                  onValueChange={(value) => setSelectedCameraId(Number(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una cámara" />
                  </SelectTrigger>
                  <SelectContent>
                    {cameras?.map((camera) => (
                      <SelectItem key={camera.id} value={camera.id.toString()}>
                        {camera.name} - {camera.location || "Sin ubicación"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedCamera && (
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <p className="text-sm"><span className="font-medium">URL:</span> {selectedCamera.streamUrl}</p>
                    <p className="text-sm"><span className="font-medium">Estado:</span> {selectedCamera.status}</p>
                    <p className="text-sm"><span className="font-medium">Tipo:</span> {selectedCamera.cameraType}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle>Configuración de Procesamiento</CardTitle>
              <CardDescription>Ajusta los parámetros de detección</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Procesamiento Local</Label>
                  <p className="text-sm text-muted-foreground">
                    Usar modelo YOLO local (requiere dependencias instaladas)
                  </p>
                </div>
                <Switch
                  checked={useLocalProcessing}
                  onCheckedChange={setUseLocalProcessing}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Umbral de Confianza</Label>
                  <span className="text-sm text-muted-foreground">{(confidenceThreshold[0] * 100).toFixed(0)}%</span>
                </div>
                <Slider
                  value={confidenceThreshold}
                  onValueChange={setConfidenceThreshold}
                  min={0.1}
                  max={0.9}
                  step={0.05}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Detecciones con confianza menor a este valor serán descartadas
                </p>
              </div>

              <Button
                onClick={handleProcessFrame}
                disabled={!selectedCameraId || processFrameMutation.isPending}
                className="w-full"
                size="lg"
              >
                {processFrameMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Procesar Frame Ahora
                  </>
                )}
              </Button>

              <div className="pt-4 border-t space-y-3">
                <Label>Procesamiento Continuo</Label>
                <p className="text-sm text-muted-foreground">
                  Procesa automáticamente cada 60 segundos
                </p>
                
                {isCameraProcessing && (
                  <div className="flex items-center gap-2 p-2 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                      Procesamiento activo
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => selectedCameraId && startContinuousMutation.mutate({ cameraId: selectedCameraId })}
                    disabled={!selectedCameraId || isCameraProcessing || startContinuousMutation.isPending}
                    variant="outline"
                    size="sm"
                  >
                    <PlayCircle className="w-4 h-4 mr-2" />
                    Iniciar
                  </Button>
                  <Button
                    onClick={() => selectedCameraId && stopContinuousMutation.mutate({ cameraId: selectedCameraId })}
                    disabled={!selectedCameraId || !isCameraProcessing || stopContinuousMutation.isPending}
                    variant="outline"
                    size="sm"
                  >
                    <StopCircle className="w-4 h-4 mr-2" />
                    Detener
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button
                    onClick={() => startAllMutation.mutate()}
                    disabled={startAllMutation.isPending}
                    variant="secondary"
                    size="sm"
                  >
                    Iniciar Todas
                  </Button>
                  <Button
                    onClick={() => stopAllMutation.mutate()}
                    disabled={stopAllMutation.isPending}
                    variant="secondary"
                    size="sm"
                  >
                    Detener Todas
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {lastDetection && (
            <Card className="bg-card text-card-foreground border-primary">
              <CardHeader>
                <CardTitle>Última Detección</CardTitle>
                <CardDescription>Resultados del procesamiento más reciente</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <p className="text-3xl font-bold">{lastDetection.personCount}</p>
                    <p className="text-sm text-muted-foreground">Personas</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <Armchair className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <p className="text-3xl font-bold">{lastDetection.chairCount}</p>
                    <p className="text-sm text-muted-foreground">Sillas</p>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <p className="text-3xl font-bold">{lastDetection.occupancyRate}%</p>
                    <p className="text-sm text-muted-foreground">Ocupación</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Confianza Promedio: {(lastDetection.confidence * 100).toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">
                    Detecciones encontradas: {lastDetection.detections?.length || 0}
                  </p>
                  
                  {lastDetection.error && (
                    <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
                      <p className="text-sm text-destructive">{lastDetection.error}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle>Historial de Detecciones</CardTitle>
              <CardDescription>Últimas detecciones registradas</CardDescription>
            </CardHeader>
            <CardContent>
              {detectionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : !detections || detections.length === 0 ? (
                <div className="text-center py-8">
                  <Camera className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No hay detecciones aún</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {detections.map((detection) => (
                    <div key={detection.id} className="p-3 bg-muted rounded-lg space-y-1">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium">
                          {new Date(detection.timestamp).toLocaleString('es-ES')}
                        </p>
                        <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                          {detection.occupancyRate}%
                        </span>
                      </div>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>{detection.personCount} personas</span>
                        <span>{detection.chairCount} sillas</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle>Información del Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Modo:</span>
                <span className="font-medium">{useLocalProcessing ? "Local (YOLO)" : "API Externa"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Modelo:</span>
                <span className="font-medium">YOLOv8 Nano</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Clases:</span>
                <span className="font-medium">Personas, Sillas</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
