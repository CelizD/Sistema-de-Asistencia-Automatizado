import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { CalendarClock, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";

const DAYS = [
  { value: 1, label: "Lunes" },
  { value: 2, label: "Martes" },
  { value: 3, label: "Miércoles" },
  { value: 4, label: "Jueves" },
  { value: 5, label: "Viernes" },
  { value: 6, label: "Sábado" },
  { value: 7, label: "Domingo" },
];

export default function Schedules() {
  const { isAuthenticated, loading } = useAuth();
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    subject: "",
    dayOfWeek: "1",
    startTime: "08:00",
    endTime: "10:00",
  });

  const utils = trpc.useUtils();
  const { data: rooms } = trpc.rooms.list.useQuery();
  const { data: schedules } = trpc.schedules.getByRoom.useQuery(
    { roomId: selectedRoomId! },
    { enabled: !!selectedRoomId }
  );

  const createMutation = trpc.schedules.create.useMutation({
    onSuccess: () => {
      utils.schedules.getByRoom.invalidate();
      setFormData({ ...formData, subject: "" }); // Limpiar solo el nombre
      toast.success("Clase programada exitosamente");
    },
    onError: (err) => toast.error("Error: " + err.message),
  });

  if (loading) return <div>Cargando...</div>;
  if (!isAuthenticated) return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <p>Debes iniciar sesión</p>
          <Button asChild><a href={getLoginUrl()}>Login</a></Button>
      </div>
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoomId) {
      toast.error("Selecciona una sala primero");
      return;
    }
    createMutation.mutate({
      roomId: selectedRoomId,
      subject: formData.subject,
      dayOfWeek: parseInt(formData.dayOfWeek),
      startTime: formData.startTime,
      endTime: formData.endTime,
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Horarios</h1>
        <p className="text-muted-foreground">Programa las clases para automatizar el control de asistencia</p>
      </div>

      <div className="grid gap-6 md:grid-cols-[350px_1fr]">
        {/* Panel Izquierdo: Formulario */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Seleccionar Sala</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedRoomId?.toString() || ""}
                onValueChange={(val) => setSelectedRoomId(parseInt(val))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Elige un aula..." />
                </SelectTrigger>
                <SelectContent>
                  {rooms?.map((room) => (
                    <SelectItem key={room.id} value={room.id.toString()}>
                      {room.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className={!selectedRoomId ? "opacity-50 pointer-events-none" : ""}>
            <CardHeader>
              <CardTitle>2. Agregar Clase</CardTitle>
              <CardDescription>Configura la asignatura y horario</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Asignatura / Evento</Label>
                  <Input 
                    placeholder="Ej. Matemáticas Avanzadas" 
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Día de la semana</Label>
                  <Select 
                    value={formData.dayOfWeek}
                    onValueChange={(val) => setFormData({...formData, dayOfWeek: val})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map(day => (
                        <SelectItem key={day.value} value={day.value.toString()}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Inicio</Label>
                    <Input 
                      type="time" 
                      value={formData.startTime}
                      onChange={(e) => setFormData({...formData, startTime: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Fin</Label>
                    <Input 
                      type="time" 
                      value={formData.endTime}
                      onChange={(e) => setFormData({...formData, endTime: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  <Plus className="w-4 h-4 mr-2" />
                  {createMutation.isPending ? "Guardando..." : "Programar Clase"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Panel Derecho: Lista */}
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Horario Semanal</CardTitle>
            <CardDescription>
              {selectedRoomId 
                ? `Clases programadas para ${rooms?.find(r => r.id === selectedRoomId)?.name}` 
                : "Selecciona una sala para ver su horario"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedRoomId ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CalendarClock className="w-16 h-16 mb-4 opacity-20" />
                <p>Esperando selección de sala...</p>
              </div>
            ) : schedules?.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No hay clases programadas para esta sala.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Día</TableHead>
                    <TableHead>Horario</TableHead>
                    <TableHead>Asignatura</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules?.map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell className="font-medium">
                        {DAYS.find(d => d.value === schedule.dayOfWeek)?.label}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="bg-muted px-2 py-1 rounded text-xs">{schedule.startTime}</span>
                          <span>-</span>
                          <span className="bg-muted px-2 py-1 rounded text-xs">{schedule.endTime}</span>
                        </div>
                      </TableCell>
                      <TableCell>{schedule.subject}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}