import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { AlertCircle, BarChart3, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function Statistics() {
  const { isAuthenticated, loading } = useAuth();
  const [selectedCameraId, setSelectedCameraId] = useState<number | null>(null);

  const { data: cameras, isLoading: camerasLoading } = trpc.cameras.list.useQuery();
  const { data: detections, isLoading: detectionsLoading } = trpc.detections.getByCameraId.useQuery(
    { cameraId: selectedCameraId!, limit: 50 },
    { enabled: selectedCameraId !== null }
  );
  const { data: allDetections } = trpc.detections.latest.useQuery({ limit: 100 });

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estadísticas y Reportes</h1>
          <p className="text-muted-foreground">Análisis detallado de ocupación y actividad</p>
        </div>
      </div>

        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>Selección de Cámara</CardTitle>
            <CardDescription>Elige una cámara para ver sus estadísticas detalladas</CardDescription>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="bg-card text-card-foreground">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ocupación Promedio</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">{stats.avgOccupancy}%</div>
                  <p className="text-xs text-muted-foreground">
                    Últimas {stats.totalDetections} detecciones
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card text-card-foreground">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Ocupación Máxima</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">{stats.maxOccupancy}%</div>
                  <p className="text-xs text-muted-foreground">
                    Pico registrado
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
                    Valor más bajo
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card text-card-foreground">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Personas Promedio</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
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
                  <BarChart3 className="w-16 h-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No hay datos disponibles</h3>
                  <p className="text-sm text-muted-foreground">
                    Esta cámara no tiene detecciones registradas aún
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="bg-card text-card-foreground">
                  <CardHeader>
                    <CardTitle>Tendencia de Ocupación</CardTitle>
                    <CardDescription>
                      Porcentaje de ocupación a lo largo del tiempo - {selectedCamera?.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.03 250)" />
                        <XAxis 
                          dataKey="time" 
                          stroke="oklch(0.65 0.05 250)"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis 
                          stroke="oklch(0.65 0.05 250)"
                          style={{ fontSize: '12px' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'oklch(0.19 0.02 250)', 
                            border: '1px solid oklch(0.30 0.03 250)',
                            borderRadius: '8px',
                            color: 'oklch(0.95 0.01 250)'
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="ocupacion" 
                          stroke="oklch(0.6 0.25 250)" 
                          strokeWidth={2}
                          name="Ocupación (%)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-card text-card-foreground">
                  <CardHeader>
                    <CardTitle>Comparación Personas vs Sillas</CardTitle>
                    <CardDescription>
                      Detección de personas y sillas disponibles - {selectedCamera?.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.03 250)" />
                        <XAxis 
                          dataKey="time" 
                          stroke="oklch(0.65 0.05 250)"
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis 
                          stroke="oklch(0.65 0.05 250)"
                          style={{ fontSize: '12px' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'oklch(0.19 0.02 250)', 
                            border: '1px solid oklch(0.30 0.03 250)',
                            borderRadius: '8px',
                            color: 'oklch(0.95 0.01 250)'
                          }}
                        />
                        <Legend />
                        <Bar dataKey="personas" fill="oklch(0.6 0.25 250)" name="Personas" />
                        <Bar dataKey="sillas" fill="oklch(0.50 0.25 250)" name="Sillas" />
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
              <CardTitle>Distribución por Hora</CardTitle>
              <CardDescription>
                Actividad y ocupación promedio por hora del día (todas las cámaras)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={hourlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.30 0.03 250)" />
                  <XAxis 
                    dataKey="hora" 
                    stroke="oklch(0.65 0.05 250)"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="oklch(0.65 0.05 250)"
                    style={{ fontSize: '12px' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'oklch(0.19 0.02 250)', 
                      border: '1px solid oklch(0.30 0.03 250)',
                      borderRadius: '8px',
                      color: 'oklch(0.95 0.01 250)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="detecciones" fill="oklch(0.70 0.18 250)" name="Detecciones" />
                  <Bar dataKey="ocupacionPromedio" fill="oklch(0.6 0.25 250)" name="Ocupación Promedio (%)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
