import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Plus, Trash2, Edit, Video, AlertCircle, Lock } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Cameras() {
  const { isAuthenticated, loading } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<any>(null);
  
  // Estado para el formulario de crear
  const [formData, setFormData] = useState({
    name: "",
    streamUrl: "",
    location: "",
    cameraType: "IP",
    roomId: null as number | null,
    username: "",
    password: ""
  });

  const utils = trpc.useUtils();
  const { data: cameras, isLoading } = trpc.cameras.list.useQuery();
  const { data: rooms } = trpc.rooms.list.useQuery();
  
  const createMutation = trpc.cameras.create.useMutation({
    onSuccess: () => {
      utils.cameras.list.invalidate();
      setIsAddDialogOpen(false);
      setFormData({ name: "", streamUrl: "", location: "", cameraType: "IP", roomId: null, username: "", password: "" });
      toast.success("Cámara agregada exitosamente");
    },
    onError: (error) => {
      toast.error("Error al agregar cámara: " + error.message);
    },
  });

  const updateMutation = trpc.cameras.update.useMutation({
    onSuccess: () => {
      utils.cameras.list.invalidate();
      setIsEditDialogOpen(false);
      setEditingCamera(null);
      toast.success("Cámara actualizada exitosamente");
    },
    onError: (error) => {
      toast.error("Error al actualizar cámara: " + error.message);
    },
  });

  const deleteMutation = trpc.cameras.delete.useMutation({
    onSuccess: () => {
      utils.cameras.list.invalidate();
      toast.success("Cámara eliminada exitosamente");
    },
    onError: (error) => {
      toast.error("Error al eliminar cámara: " + error.message);
    },
  });

  if (loading || isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <AlertCircle className="w-16 h-16 text-destructive" />
        <h1 className="text-2xl font-bold">Acceso Restringido</h1>
        <Button asChild><a href={getLoginUrl()}>Iniciar Sesión</a></Button>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // CORRECCIÓN 1: Convertimos null a undefined explícitamente
    createMutation.mutate({
      ...formData,
      roomId: formData.roomId ?? undefined
    });
  };

  const handleEdit = (camera: any) => {
    setEditingCamera(camera);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCamera) return;
    
    // Lógica para manejar roomId opcional
    let roomIdValue: number | undefined = undefined;
    
    // Si no es "none" y tiene valor, intentamos convertirlo
    if (editingCamera.roomId !== "none" && editingCamera.roomId !== null && editingCamera.roomId !== undefined) {
       const parsed = Number(editingCamera.roomId);
       if (!isNaN(parsed)) {
         roomIdValue = parsed;
       }
    }

    updateMutation.mutate({
      id: editingCamera.id,
      name: editingCamera.name,
      streamUrl: editingCamera.streamUrl,
      location: editingCamera.location,
      status: editingCamera.status,
      cameraType: editingCamera.cameraType,
      roomId: roomIdValue, // Aquí pasamos undefined o number
      username: editingCamera.username,
      password: editingCamera.password
    });
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`¿Estás seguro de eliminar la cámara "${name}"?`)) {
      deleteMutation.mutate({ id });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Cámaras</h1>
          <p className="text-muted-foreground">Administra las cámaras IP del sistema</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Agregar Cámara
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-popover text-popover-foreground">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>Agregar Nueva Cámara</DialogTitle>
                <DialogDescription>Configura la conexión RTSP/HTTP</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Nombre</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Aula 101 - Principal"
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="streamUrl">URL del Stream (Sin credenciales)</Label>
                  <Input
                    id="streamUrl"
                    value={formData.streamUrl}
                    onChange={(e) => setFormData({ ...formData, streamUrl: e.target.value })}
                    placeholder="rtsp://192.168.1.100:554/live/ch1"
                    required
                  />
                </div>
                
                {/* === CAMPOS DE CREDENCIALES === */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="username">Usuario (Opcional)</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="admin"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Contraseña (Opcional)</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••"
                    />
                  </div>
                </div>
                {/* ============================ */}

                <div className="grid gap-2">
                  <Label htmlFor="roomId">Sala Asignada</Label>
                  <Select
                    value={formData.roomId?.toString() || "none"}
                    onValueChange={(value) => setFormData({ ...formData, roomId: value === "none" ? null : parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar sala" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin sala asignada</SelectItem>
                      {rooms?.map((room) => (
                        <SelectItem key={room.id} value={room.id.toString()}>
                          {room.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="location">Ubicación Física</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Ej: Edificio A - Planta Baja"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Agregando..." : "Guardar Cámara"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cameras?.map((camera) => (
          <Card key={camera.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-primary" />
                  <CardTitle className="text-lg">{camera.name}</CardTitle>
                </div>
                {/* CORRECCIÓN 2: Envolver el icono en un span para el title */}
                {camera.username && (
                  <span title="Credenciales configuradas">
                    <Lock className="w-4 h-4 text-green-600" />
                  </span>
                )}
              </div>
              <CardDescription>{camera.location || "Sin ubicación"}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-xs font-mono bg-muted p-2 rounded truncate" title={camera.streamUrl}>
                {camera.streamUrl}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(camera)}>
                  <Edit className="w-4 h-4 mr-2" /> Editar
                </Button>
                <Button variant="destructive" size="sm" onClick={() => handleDelete(camera.id, camera.name)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* DIALOGO DE EDICIÓN */}
      {editingCamera && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-lg bg-popover text-popover-foreground">
            <form onSubmit={handleUpdate}>
              <DialogHeader>
                <DialogTitle>Editar Cámara</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Nombre</Label>
                  <Input
                    value={editingCamera.name}
                    onChange={(e) => setEditingCamera({ ...editingCamera, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>URL</Label>
                  <Input
                    value={editingCamera.streamUrl}
                    onChange={(e) => setEditingCamera({ ...editingCamera, streamUrl: e.target.value })}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Usuario</Label>
                    <Input
                      value={editingCamera.username || ""} 
                      onChange={(e) => setEditingCamera({ ...editingCamera, username: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Contraseña</Label>
                    <Input
                      type="password"
                      value={editingCamera.password || ""}
                      onChange={(e) => setEditingCamera({ ...editingCamera, password: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-roomId">Sala Asignada</Label>
                  <Select
                    value={editingCamera.roomId?.toString() || "none"}
                    onValueChange={(value) => setEditingCamera({ ...editingCamera, roomId: value })}
                  >
                    <SelectTrigger id="edit-roomId">
                      <SelectValue placeholder="Seleccionar sala" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin sala asignada</SelectItem>
                      {rooms?.map((room) => (
                        <SelectItem key={room.id} value={room.id.toString()}>
                          {room.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label>Estado</Label>
                  <Select
                    value={editingCamera.status || "active"}
                    onValueChange={(val) => setEditingCamera({ ...editingCamera, status: val })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activa</SelectItem>
                      <SelectItem value="inactive">Inactiva</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={updateMutation.isPending}>
                  Guardar Cambios
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}