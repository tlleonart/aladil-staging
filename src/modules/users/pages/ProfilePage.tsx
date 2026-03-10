"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { orpc } from "@/modules/core/orpc/client";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@/modules/core/orpc/react";
import { getErrorMessage } from "@/modules/shared/lib/get-error-message";

export const ProfilePage = () => {
  const queryClient = useQueryClient();

  const { data: me, isLoading } = useQuery({
    queryKey: ["users", "me"],
    queryFn: () => orpc.users.me({}),
  });

  const [name, setName] = useState("");
  const [nameInitialized, setNameInitialized] = useState(false);

  // Initialize name from server data once loaded
  if (me?.name && !nameInitialized) {
    setName(me.name);
    setNameInitialized(true);
  }

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const profileMutation = useMutation({
    mutationFn: (data: { name: string }) => orpc.users.updateProfile(data),
    onSuccess: () => {
      toast.success("Perfil actualizado");
      queryClient.invalidateQueries({ queryKey: ["users", "me"] });
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const passwordMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      orpc.users.changePassword(data),
    onSuccess: () => {
      toast.success("Contraseña actualizada");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    },
    onError: (err) => {
      toast.error(getErrorMessage(err));
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    profileMutation.mutate({ name: name.trim() });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }
    passwordMutation.mutate({ currentPassword, newPassword });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">Mi Perfil</h1>
        <p className="text-sm text-neutral-500">
          Actualiza tu información personal y contraseña.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información Personal</CardTitle>
          <CardDescription>
            Tu nombre será visible para otros usuarios de la intranet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                value={me?.email ?? ""}
                disabled
                className="bg-neutral-50"
              />
              <p className="text-xs text-neutral-500">
                El correo no se puede cambiar. Contacta a un administrador.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre y Apellido"
                required
              />
            </div>

            {me?.labName && (
              <div className="space-y-2">
                <Label>Laboratorio</Label>
                <Input value={me.labName} disabled className="bg-neutral-50" />
              </div>
            )}

            <Button
              type="submit"
              disabled={profileMutation.isPending || name.trim() === me?.name}
            >
              {profileMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Cambiar Contraseña</CardTitle>
          <CardDescription>
            Ingresa tu contraseña actual y luego la nueva contraseña.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Contraseña Actual</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
              <p className="text-xs text-neutral-500">Mínimo 8 caracteres.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirmar Nueva Contraseña
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
              />
            </div>

            <Button
              type="submit"
              disabled={
                passwordMutation.isPending ||
                !currentPassword ||
                !newPassword ||
                !confirmPassword
              }
            >
              {passwordMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cambiando...
                </>
              ) : (
                "Cambiar Contraseña"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
