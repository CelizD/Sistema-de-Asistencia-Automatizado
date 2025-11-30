import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Camera, Plus, Trash2, Edit, Video, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Cameras() {
  const { isAuthenticated, loading } = useAuth();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    streamUrl: "",
    location: "",
    cameraType: "IP",
    roomId: null as number | null,
  });

  const utils = trpc.useUtils();
  const { data: cameras, isLoading } = trpc.cameras.list.useQuery();
  const { data: rooms } = trpc.rooms.list.useQuery();
  
  const createMutation = trpc.cameras.create.useMutation({
    onSuccess: () => {
      utils.cameras.list.invalidate();
      setIsAddDialogOpen(false);
      setFormData({ name: "", streamUrl: "", location: "", cameraType: "IP", roomId: null });
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

  if (loading || isLoading) {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleEdit = (camera: any) => {
    setEditingCamera(camera);
    setIsEditDialogOpen(true);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCamera) return;
    updateMutation.mutate({
      id: editingCamera.id,
      name: editingCamera.name,
      streamUrl: editingCamera.streamUrl,
      location: editingCamera.location,
      status: editingCamera.status,
      cameraType: editingCamera.cameraType,
    });
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`¿Estás seguro de eliminar la cámara "${name}"?`)) {
      deleteMutation.mutate({ id });
    }
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "active": return "text-green-500";
      case "inactive": return "text-yellow-500";
      case "error": return "text-red-500";
      default: return "text-gray-500";
    }
  };

  const getStatusLabel = (status: string | null) => {
    if (!status) return "Desconocido";
    switch (status) {
      case "active": return "Activa";
      case "inactive": return "Inactiva";
      case "error": return "Error";
      default: return status;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Cámaras</h1>
          <p className="text-muted-foreground">Administra las cámaras IP del sistema</p>
        </div>
        <div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Cámara
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-popover text-popover-foreground">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>Agregar Nueva Cámara</DialogTitle>
                    <DialogDescription>
                      Ingresa los datos de la cámara IP que deseas agregar al sistema
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Nombre</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ej: Cámara Aula 101"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="streamUrl">URL del Stream</Label>
                      <Input
                        id="streamUrl"
                        value={formData.streamUrl}
                        onChange={(e) => setFormData({ ...formData, streamUrl: e.target.value })}
                        placeholder="rtsp://192.168.1.100:554/stream"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="location">Ubicación</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Ej: Edificio A - Piso 1"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="cameraType">Tipo de Cámara</Label>
                      <Input
                        id="cameraType"
                        value={formData.cameraType}
                        onChange={(e) => setFormData({ ...formData, cameraType: e.target.value })}
                        placeholder="IP"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="roomId">Sala Asignada (Opcional)</Label>
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
                              {room.name} ({room.capacity} sillas)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" disabled={createMutation.isPending}>
                      {createMutation.isPending ? "Agregando..." : "Agregar Cámara"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
        </div>
      </div>

      {!cameras || cameras.length === 0 ? (
          <Card className="bg-card text-card-foreground">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Camera className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay cámaras registradas</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Comienza agregando tu primera cámara al sistema
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Primera Cámara
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cameras.map((camera) => (
              <Card key={camera.id} className="bg-card text-card-foreground">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Video className="w-5 h-5 text-primary" />
                      <CardTitle className="text-lg">{camera.name}</CardTitle>
                    </div>
                    <span className={`text-xs font-semibold ${getStatusColor(camera.status)}`}>
                      {getStatusLabel(camera.status)}
                    </span>
                  </div>
                  <CardDescription>{camera.location || "Sin ubicación"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Tipo:</span>{" "}
                      <span className="font-medium">{camera.cameraType}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">URL:</span>{" "}
                      <span className="font-mono text-xs break-all">{camera.streamUrl}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Creada:</span>{" "}
                      <span>{new Date(camera.createdAt).toLocaleDateString('es-ES')}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(camera)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(camera.id, camera.name)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {editingCamera && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="bg-popover text-popover-foreground">
              <form onSubmit={handleUpdate}>
                <DialogHeader>
                  <DialogTitle>Editar Cámara</DialogTitle>
                  <DialogDescription>
                    Modifica los datos de la cámara
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-name">Nombre</Label>
                    <Input
                      id="edit-name"
                      value={editingCamera.name}
                      onChange={(e) => setEditingCamera({ ...editingCamera, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-streamUrl">URL del Stream</Label>
                    <Input
                      id="edit-streamUrl"
                      value={editingCamera.streamUrl}
                      onChange={(e) => setEditingCamera({ ...editingCamera, streamUrl: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-location">Ubicación</Label>
                    <Input
                      id="edit-location"
                      value={editingCamera.location || ""}
                      onChange={(e) => setEditingCamera({ ...editingCamera, location: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-status">Estado</Label>
                    <Select
                      value={editingCamera.status}
                      onValueChange={(value) => setEditingCamera({ ...editingCamera, status: value })}
                    >
                      <SelectTrigger id="edit-status">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Activa</SelectItem>
                        <SelectItem value="inactive">Inactiva</SelectItem>
                        <SelectItem value="error">Error</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-cameraType">Tipo de Cámara</Label>
                    <Input
                      id="edit-cameraType"
                      value={editingCamera.cameraType || ""}
                      onChange={(e) => setEditingCamera({ ...editingCamera, cameraType: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="edit-roomId">Sala Asignada</Label>
                    <Select
                      value={editingCamera.roomId?.toString() || "none"}
                      onValueChange={(value) => setEditingCamera({ ...editingCamera, roomId: value === "none" ? null : parseInt(value) })}
                    >
                      <SelectTrigger id="edit-roomId">
                        <SelectValue placeholder="Seleccionar sala" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Sin sala asignada</SelectItem>
                        {rooms?.map((room) => (
                          <SelectItem key={room.id} value={room.id.toString()}>
                            {room.name} ({room.capacity} sillas)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    {updateMutation.isPending ? "Actualizando..." : "Guardar Cambios"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
      )}
    </div>
  );
}
