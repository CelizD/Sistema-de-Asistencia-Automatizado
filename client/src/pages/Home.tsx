import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Camera, Activity, Users, TrendingUp, Building2, FileText } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const { data: cameras, isLoading: camerasLoading } = trpc.cameras.list.useQuery();
  const { data: latestDetections } = trpc.detections.latest.useQuery({ limit: 5 });

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
        <div className="max-w-2xl w-full space-y-8 text-center">
          <div className="space-y-4">
            <Camera className="w-20 h-20 mx-auto text-primary" />
            <h1 className="text-4xl font-bold tracking-tight">{APP_TITLE}</h1>
            <p className="text-xl text-muted-foreground">
              Sistema de control de asistencia automático usando detección de personas mediante cámaras IP
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-8">
            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <Camera className="w-10 h-10 mb-2 text-primary" />
                <CardTitle>Monitoreo en Tiempo Real</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Visualiza múltiples cámaras simultáneamente con detección automática de personas
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <Activity className="w-10 h-10 mb-2 text-primary" />
                <CardTitle>Detección Automática</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Cálculo automático de ocupación y estadísticas en tiempo real
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <TrendingUp className="w-10 h-10 mb-2 text-primary" />
                <CardTitle>Estadísticas Detalladas</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Gráficos y reportes de ocupación por hora, día y ubicación
                </p>
              </CardContent>
            </Card>
          </div>

          <Button size="lg" asChild>
            <a href={getLoginUrl()}>Iniciar Sesión</a>
          </Button>
        </div>
      </div>
    );
  }

  const activeCameras = cameras?.filter(c => c.status === "active").length || 0;
  const totalCameras = cameras?.length || 0;
  const latestOccupancy = latestDetections?.[0]?.occupancyRate || 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
            <p className="text-muted-foreground">Bienvenido, {user?.name}</p>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" asChild>
              <Link href="/cameras">
                <Camera className="w-4 h-4 mr-2" />
                Gestionar Cámaras
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/statistics">
                <TrendingUp className="w-4 h-4 mr-2" />
                Estadísticas
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/rooms">
                <Building2 className="w-4 h-4 mr-2" />
                Salas
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/logs">
                <FileText className="w-4 h-4 mr-2" />
                Logs
              </Link>
            </Button>
            <Button asChild>
              <Link href="/monitoring">
                <Activity className="w-4 h-4 mr-2" />
                Monitoreo en Vivo
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-card text-card-foreground">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Cámaras Activas</CardTitle>
              <Camera className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeCameras} / {totalCameras}</div>
              <p className="text-xs text-muted-foreground">
                {totalCameras === 0 ? "No hay cámaras registradas" : `${Math.round((activeCameras / totalCameras) * 100)}% operativas`}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card text-card-foreground">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ocupación Actual</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{latestOccupancy}%</div>
              <p className="text-xs text-muted-foreground">
                Última detección registrada
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card text-card-foreground">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Detecciones Hoy</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{latestDetections?.length || 0}</div>
              <p className="text-xs text-muted-foreground">
                Registros recientes
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle>Últimas Detecciones</CardTitle>
            <CardDescription>Actividad reciente del sistema de monitoreo</CardDescription>
          </CardHeader>
          <CardContent>
            {!latestDetections || latestDetections.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay detecciones registradas aún
              </p>
            ) : (
              <div className="space-y-4">
                {latestDetections.map((detection) => {
                  const camera = cameras?.find(c => c.id === detection.cameraId);
                  return (
                    <div key={detection.id} className="flex items-center justify-between border-b border-border pb-4 last:border-0">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">
                          {camera?.name || `Cámara ${detection.cameraId}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(detection.timestamp).toLocaleString('es-ES')}
                        </p>
                      </div>
                      <div className="flex gap-6 text-sm">
                        <div className="text-center">
                          <p className="font-semibold">{detection.personCount}</p>
                          <p className="text-xs text-muted-foreground">Personas</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold">{detection.chairCount}</p>
                          <p className="text-xs text-muted-foreground">Sillas</p>
                        </div>
                        <div className="text-center">
                          <p className="font-semibold text-primary">{detection.occupancyRate}%</p>
                          <p className="text-xs text-muted-foreground">Ocupación</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
