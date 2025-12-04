import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { MoreHorizontal, Shield, ShieldAlert, Trash2, UserCog } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function AdminUsers() {
  const { user, isAuthenticated, loading } = useAuth();
  const utils = trpc.useUtils();
  
  const { data: users, isLoading } = trpc.users.list.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === 'admin'
  });

  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      utils.users.list.invalidate();
      toast.success("Rol de usuario actualizado");
    },
    onError: (err) => toast.error("Error al actualizar rol: " + err.message)
  });

  const deleteUserMutation = trpc.users.delete.useMutation({
    onSuccess: () => {
      utils.users.list.invalidate();
      toast.success("Usuario eliminado");
    },
    onError: (err) => toast.error("Error al eliminar usuario: " + err.message)
  });

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Protección: Solo admins pueden ver esto
  if (!isAuthenticated || user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-4">
        <div className="text-center space-y-4">
          <ShieldAlert className="w-16 h-16 mx-auto text-destructive" />
          <h1 className="text-2xl font-bold">Acceso Denegado</h1>
          <p className="text-muted-foreground">Se requieren privilegios de Administrador para ver esta página.</p>
          <Button asChild variant="outline">
            <Link href="/">Volver al Inicio</Link>
          </Button>
        </div>
      </div>
    );
  }

  const handleRoleChange = (userId: number, newRole: "admin" | "user") => {
    if (userId === user?.id) {
      toast.error("No puedes cambiar tu propio rol");
      return;
    }
    updateRoleMutation.mutate({ userId, role: newRole });
  };

  const handleDelete = (userId: number) => {
    if (userId === user?.id) {
      toast.error("No puedes eliminar tu propia cuenta");
      return;
    }
    if (confirm("¿Estás seguro de eliminar este usuario permanentemente?")) {
      deleteUserMutation.mutate({ id: userId });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Administración de Usuarios</h1>
        <p className="text-muted-foreground">Gestiona el acceso y los roles del personal</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios Registrados</CardTitle>
          <CardDescription>
            Lista de todas las cuentas con acceso al sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Email / ID</TableHead>
                <TableHead>Rol Actual</TableHead>
                <TableHead>Último Acceso</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users?.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {u.name ? u.name[0].toUpperCase() : "U"}
                      </div>
                      {u.name || "Usuario Sin Nombre"}
                    </div>
                  </TableCell>
                  <TableCell>{u.email || u.openId}</TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'admin' ? "default" : "secondary"}>
                      {u.role === 'admin' ? "Administrador" : "Operador"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(u.lastSignedIn).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleRoleChange(u.id, "admin")}>
                          <Shield className="mr-2 h-4 w-4" />
                          Hacer Admin
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleRoleChange(u.id, "user")}>
                          <UserCog className="mr-2 h-4 w-4" />
                          Hacer Operador
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600 focus:text-red-600"
                          onClick={() => handleDelete(u.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar Cuenta
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}