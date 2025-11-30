import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { AlertCircle, Building2, Edit, MapPin, Plus, Trash2, Users } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

export default function Rooms() {
  const { isAuthenticated, loading } = useAuth();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    capacity: 0,
    roomType: "",
    gridRows: 5,
    gridCols: 5,
  });

  const { data: rooms, isLoading, refetch } = trpc.rooms.list.useQuery();
  const createMutation = trpc.rooms.create.useMutation({
    onSuccess: () => {
      toast.success("Sala creada exitosamente");
      setIsCreateOpen(false);
      refetch();
      resetForm();
    },
    onError: (error) => {
      toast.error(`Error al crear sala: ${error.message}`);
    },
  });

  const updateMutation = trpc.rooms.update.useMutation({
    onSuccess: () => {
      toast.success("Sala actualizada exitosamente");
      setIsEditOpen(false);
      refetch();
      resetForm();
    },
    onError: (error) => {
      toast.error(`Error al actualizar sala: ${error.message}`);
    },
  });

  const deleteMutation = trpc.rooms.delete.useMutation({
    onSuccess: () => {
      toast.success("Sala eliminada exitosamente");
      refetch();
    },
    onError: (error) => {
      toast.error(`Error al eliminar sala: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      location: "",
      capacity: 0,
      roomType: "",
      gridRows: 5,
      gridCols: 5,
    });
    setSelectedRoom(null);
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleEdit = (room: any) => {
    setSelectedRoom(room);
    setFormData({
      name: room.name,
      location: room.location || "",
      capacity: room.capacity || 0,
      roomType: room.roomType || "",
      gridRows: room.gridRows || 5,
      gridCols: room.gridCols || 5,
    });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (selectedRoom) {
      updateMutation.mutate({ id: selectedRoom.id, ...formData });
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta sala?")) {
      deleteMutation.mutate({ id });
    }
  };

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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Salas</h1>
          <p className="text-muted-foreground">Administra los espacios donde se ubican las cámaras</p>
        </div>
        <div>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Sala
            </Button>
        </div>
      </div>

        {!rooms || rooms.length === 0 ? (
          <Card className="bg-card text-card-foreground">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Building2 className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay salas registradas</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Comienza agregando tu primera sala
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primera Sala
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rooms.map((room) => (
              <Card key={room.id} className="bg-card text-card-foreground">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    {room.name}
                  </CardTitle>
                  <CardDescription>{room.roomType || "Sin tipo especificado"}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{room.location || "Sin ubicación"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>Capacidad: {room.capacity || 0} personas</span>
                    </div>
                    <div className="text-muted-foreground">
                      Grid: {room.gridRows || 5}x{room.gridCols || 5} ({(room.gridRows || 5) * (room.gridCols || 5)} sillas)
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(room)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(room.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Dialog para crear sala */}
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogContent className="bg-card text-card-foreground">
            <DialogHeader>
              <DialogTitle>Crear Nueva Sala</DialogTitle>
              <DialogDescription>
                Ingresa los detalles de la nueva sala
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Sala de Conferencias A"
                />
              </div>
              <div>
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Ej: Edificio Principal, Piso 2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="capacity">Capacidad</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="roomType">Tipo</Label>
                  <Input
                    id="roomType"
                    value={formData.roomType}
                    onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                    placeholder="Ej: Aula, Oficina"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gridRows">Filas del Grid</Label>
                  <Input
                    id="gridRows"
                    type="number"
                    value={formData.gridRows}
                    onChange={(e) => setFormData({ ...formData, gridRows: parseInt(e.target.value) || 5 })}
                  />
                </div>
                <div>
                  <Label htmlFor="gridCols">Columnas del Grid</Label>
                  <Input
                    id="gridCols"
                    type="number"
                    value={formData.gridCols}
                    onChange={(e) => setFormData({ ...formData, gridCols: parseInt(e.target.value) || 5 })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button onClick={handleCreate} disabled={!formData.name || createMutation.isPending}>
                {createMutation.isPending ? "Creando..." : "Crear Sala"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog para editar sala */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="bg-card text-card-foreground">
            <DialogHeader>
              <DialogTitle>Editar Sala</DialogTitle>
              <DialogDescription>
                Modifica los detalles de la sala
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nombre</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-location">Ubicación</Label>
                <Input
                  id="edit-location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-capacity">Capacidad</Label>
                  <Input
                    id="edit-capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-roomType">Tipo</Label>
                  <Input
                    id="edit-roomType"
                    value={formData.roomType}
                    onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-gridRows">Filas del Grid</Label>
                  <Input
                    id="edit-gridRows"
                    type="number"
                    value={formData.gridRows}
                    onChange={(e) => setFormData({ ...formData, gridRows: parseInt(e.target.value) || 5 })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-gridCols">Columnas del Grid</Label>
                  <Input
                    id="edit-gridCols"
                    type="number"
                    value={formData.gridCols}
                    onChange={(e) => setFormData({ ...formData, gridCols: parseInt(e.target.value) || 5 })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setIsEditOpen(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button onClick={handleUpdate} disabled={!formData.name || updateMutation.isPending}>
                {updateMutation.isPending ? "Actualizando..." : "Actualizar Sala"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}
