import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { AlertCircle, BarChart3, TrendingUp, Download, FileSpreadsheet, Users } from "lucide-react";
import { useMemo, useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { toast } from "sonner";

export default function Statistics() {
  const { isAuthenticated, loading } = useAuth();
  const [selectedCameraId, setSelectedCameraId] = useState<number | null>(null);

  const { data: cameras, isLoading: camerasLoading } = trpc.cameras.list.useQuery();
  const { data: detections, isLoading: detectionsLoading } = trpc.detections.getByCameraId.useQuery(
    { cameraId: selectedCameraId!, limit: 100 },
    { enabled: selectedCameraId !== null }
  );
  const { data: allDetections } = trpc.detections.latest.useQuery({ limit: 100 });

  // === FUNCIÓN DE EXPORTACIÓN ===
  const handleExport = () => {
    if (!detections || detections.length === 0) {
      toast.error("No hay datos disponibles para exportar");
      return;
    }

    try {
      // 1. Definir cabeceras del CSV
      const headers = ["ID", "Fecha", "Hora", "Cámara ID", "Personas", "Sillas", "Ocupación (%)"];
      
      // 2. Mapear datos a filas
      const rows = detections.map(d => [
        d.id,
        new Date(d.timestamp).toLocaleDateString('es-ES'),
        new Date(d.timestamp).toLocaleTimeString('es-ES'),
        d.cameraId,
        d.personCount,
        d.chairCount,
        d.occupancyRate
      ]);

      // 3. Construir el string CSV
      const csvContent = [
        headers.join(","),
        ...rows.map(r => r.join(","))
      ].join("\n");

      // 4. Crear Blob y descargar
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const fileName = `reporte_asistencia_cam${selectedCameraId}_${new Date().toISOString().split('T')[0]}.csv`;
      
      link.setAttribute("href", url);
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Reporte generado exitosamente");
    } catch (error) {
      console.error(error);
      toast.error("Error al generar el reporte");
    }
  };
  // ==============================

  if (loading || camerasLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
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

  // Procesar datos para gráficos
  const chartData = useMemo(() => {
    if (!detections || detections.length === 0) return [];

    return detections
      .slice()
      .reverse()
      .map((detection) => ({
        time: new Date(detection.timestamp).toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        }),
        personas: detection.personCount,
        sillas: detection.chairCount,
        ocupacion: detection.occupancyRate,
      }));
  }, [detections]);

  // Estadísticas generales
  const stats = useMemo(() => {
    if (!detections || detections.length === 0) {
      return {
        avgOccupancy: 0,
        maxOccupancy: 0,
        minOccupancy: 0,
        avgPersons: 0,
        totalDetections: 0,
      };
    }

    const occupancies = detections.map(d => d.occupancyRate);
    const persons = detections.map(d => d.personCount);

    return {
      avgOccupancy: Math.round(occupancies.reduce((a, b) => a + b, 0) / occupancies.length),
      maxOccupancy: Math.max(...occupancies),
      minOccupancy: Math.min(...occupancies),
      avgPersons: Math.round(persons.reduce((a, b) => a + b, 0) / persons.length),
      totalDetections: detections.length,
    };
  }, [detections]);

  // Distribución por hora
  const hourlyData = useMemo(() => {
    if (!allDetections || allDetections.length === 0) return [];

    const hourlyMap = new Map<number, { count: number; totalOccupancy: number }>();

    allDetections.forEach(detection => {
      const hour = new Date(detection.timestamp).getHours();
      const current = hourlyMap.get(hour) || { count: 0, totalOccupancy: 0 };
      hourlyMap.set(hour, {
        count: current.count + 1,
        totalOccupancy: current.totalOccupancy + detection.occupancyRate,
      });
    });

    return Array.from(hourlyMap.entries())
      .map(([hour, data]) => ({
        hora: `${hour}:00`,
        detecciones: data.count,
        ocupacionPromedio: Math.round(data.totalOccupancy / data.count),
      }))
      .sort((a, b) => parseInt(a.hora) - parseInt(b.hora));
  }, [allDetections]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estadísticas y Reportes</h1>
          <p className="text-muted-foreground">Análisis detallado de ocupación y actividad</p>
        </div>
        
        {/* Botón de Exportación */}
        {selectedCameraId && (
          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>Selección de Fuente de Datos</CardTitle>
            <CardDescription>Elige una cámara para visualizar sus métricas y generar reportes</CardDescription>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        {selectedCameraId && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-card text-card-foreground">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ocupación Promedio</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{stats.avgOccupancy}%</div>
                  <p className="text-xs text-muted-foreground">
                    Basado en {stats.totalDetections} registros
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card text-card-foreground">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Pico de Ocupación</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">{stats.maxOccupancy}%</div>
                  <p className="text-xs text-muted-foreground">
                    Máximo registrado
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card text-card-foreground">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ocupación Mínima</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-500">{stats.minOccupancy}%</div>
                  <p className="text-xs text-muted-foreground">
                    Mínimo registrado
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card text-card-foreground">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Promedio Personas</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.avgPersons}</div>
                  <p className="text-xs text-muted-foreground">
                    Por detección
                  </p>
                </CardContent>
              </Card>
            </div>

            {detectionsLoading ? (
              <Card className="bg-card text-card-foreground">
                <CardContent className="flex items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </CardContent>
              </Card>
            ) : !detections || detections.length === 0 ? (
              <Card className="bg-card text-card-foreground">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <FileSpreadsheet className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Sin datos suficientes</h3>
                  <p className="text-sm text-muted-foreground">
                    Esta cámara no tiene suficientes detecciones para generar gráficas
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="bg-card text-card-foreground">
                  <CardHeader>
                    <CardTitle>Historial de Ocupación</CardTitle>
                    <CardDescription>
                      Evolución temporal del porcentaje de ocupación - {selectedCamera?.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="time" 
                          stroke="hsl(var(--muted-foreground))"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))"
                          style={{ fontSize: '12px' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="ocupacion" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          name="Ocupación (%)"
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-card text-card-foreground">
                  <CardHeader>
                    <CardTitle>Análisis de Aforo</CardTitle>
                    <CardDescription>
                      Comparativa entre personas detectadas y sillas disponibles
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="time" 
                          stroke="hsl(var(--muted-foreground))"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))"
                          style={{ fontSize: '12px' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Legend />
                        <Bar dataKey="personas" fill="hsl(var(--primary))" name="Personas" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="sillas" fill="hsl(var(--muted))" name="Sillas Detectadas" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}

        {hourlyData.length > 0 && (
          <Card className="bg-card text-card-foreground">
            <CardHeader>
              <CardTitle>Patrones de Actividad Global</CardTitle>
              <CardDescription>
                Promedio de ocupación por hora del día (todas las cámaras)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="hora" 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="ocupacionPromedio" fill="hsl(var(--chart-2))" name="Ocupación Promedio (%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}