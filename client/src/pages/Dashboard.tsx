import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Activity, AlertTriangle, Camera, TrendingUp, Users, Video } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useMemo } from "react";

export default function Dashboard() {
  const { data: cameras, isLoading: camerasLoading } = trpc.cameras.list.useQuery();
  const { data: rooms } = trpc.rooms.list.useQuery();
  const { data: latestDetections } = trpc.detections.latest.useQuery({ limit: 10 });
  const { data: alerts } = trpc.alerts.list.useQuery();

  const activeCameras = cameras?.filter(c => c.status === "active").length || 0;
  const totalCameras = cameras?.length || 0;
  const activeRooms = rooms?.length || 0;

  // Calcular ocupación promedio actual
  const currentOccupancy = useMemo(() => {
    if (!latestDetections || latestDetections.length === 0) return 0;
    const total = latestDetections.reduce((sum, d) => sum + d.occupancyRate, 0);
    return Math.round(total / latestDetections.length);
  }, [latestDetections]);

  // Datos para gráfico de tendencia por hora
  const hourlyData = useMemo(() => {
    if (!latestDetections) return [];
    
    const hourMap = new Map<number, { total: number; count: number }>();
    
    latestDetections.forEach(detection => {
      const hour = new Date(detection.timestamp).getHours();
      const current = hourMap.get(hour) || { total: 0, count: 0 };
      hourMap.set(hour, {
        total: current.total + detection.occupancyRate,
        count: current.count + 1
      });
    });

    return Array.from(hourMap.entries())
      .map(([hour, data]) => ({
        hora: `${hour}:00`,
        ocupacion: Math.round(data.total / data.count),
        personas: Math.round(data.total / data.count * 0.3), // Estimación
      }))
      .sort((a, b) => parseInt(a.hora) - parseInt(b.hora));
  }, [latestDetections]);

  // Alertas activas
  const activeAlerts = alerts?.filter(a => a.isActive === 1).length || 0;

  if (camerasLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sistema de Asistencia Automatizado</h1>
        <p className="text-muted-foreground mt-2">
          Control de asistencia en tiempo real mediante visión por computadora
        </p>
      </div>

      {/* Métricas principales */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card text-card-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cámaras Activas</CardTitle>
            <Camera className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCameras} / {totalCameras}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((activeCameras / (totalCameras || 1)) * 100)}% operativas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ocupación Actual</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentOccupancy}%</div>
            <p className="text-xs text-muted-foreground">
              Promedio de todos los salones
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Salones Monitoreados</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRooms}</div>
            <p className="text-xs text-muted-foreground">
              Espacios configurados
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Activas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAlerts}</div>
            <p className="text-xs text-muted-foreground">
              Requieren atención
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>Tendencia de Ocupación</CardTitle>
            <CardDescription>Ocupación promedio por hora del día</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={hourlyData}>
                <defs>
                  <linearGradient id="colorOcupacion" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="hora" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="ocupacion" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1} 
                  fill="url(#colorOcupacion)" 
                  name="Ocupación %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>Detecciones por Salón</CardTitle>
            <CardDescription>Últimas detecciones registradas</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={latestDetections?.slice(0, 5).map(d => ({
                nombre: cameras?.find(c => c.id === d.cameraId)?.name || `Cámara ${d.cameraId}`,
                personas: d.personCount,
                sillas: d.chairCount,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="nombre" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }} 
                />
                <Legend />
                <Bar dataKey="personas" fill="hsl(var(--primary))" name="Personas" />
                <Bar dataKey="sillas" fill="hsl(var(--muted))" name="Sillas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Acciones rápidas */}
      <Card className="bg-card text-card-foreground">
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Accede a las funciones principales del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-20 flex-col gap-2" asChild>
              <Link href="/monitoring">
                <Activity className="h-6 w-6" />
                <span>Monitoreo en Vivo</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2" asChild>
              <Link href="/statistics">
                <TrendingUp className="h-6 w-6" />
                <span>Reportes y Estadísticas</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2" asChild>
              <Link href="/cameras">
                <Camera className="h-6 w-6" />
                <span>Gestionar Cámaras</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Últimas detecciones */}
      <Card className="bg-card text-card-foreground">
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
          <CardDescription>Últimas detecciones del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {latestDetections?.slice(0, 5).map((detection) => {
              const camera = cameras?.find(c => c.id === detection.cameraId);
              return (
                <div key={detection.id} className="flex items-center justify-between border-b border-border pb-4 last:border-0">
                  <div className="space-y-1">
                    <p className="font-medium">{camera?.name || `Cámara ${detection.cameraId}`}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(detection.timestamp).toLocaleString('es-ES')}
                    </p>
                  </div>
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="text-2xl font-bold">{detection.personCount}</p>
                      <p className="text-muted-foreground">Personas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold">{detection.chairCount}</p>
                      <p className="text-muted-foreground">Sillas</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">{detection.occupancyRate}%</p>
                      <p className="text-muted-foreground">Ocupación</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
