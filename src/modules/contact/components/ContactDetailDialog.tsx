"use client";

import { Archive, ArchiveRestore, MailOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { ContactMessage } from "../schemas";

interface ContactDetailDialogProps {
  message: ContactMessage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMarkAsRead?: (id: string) => void;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
  isLoading?: boolean;
}

const statusConfig = {
  NEW: {
    label: "Nuevo",
    variant: "default" as const,
    className: "bg-blue-600 hover:bg-blue-600",
  },
  READ: {
    label: "Leído",
    variant: "secondary" as const,
    className: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  },
  ARCHIVED: {
    label: "Archivado",
    variant: "outline" as const,
    className:
      "bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100",
  },
};

export const ContactDetailDialog = ({
  message,
  open,
  onOpenChange,
  onMarkAsRead,
  onArchive,
  onUnarchive,
  isLoading = false,
}: ContactDetailDialogProps) => {
  if (!message) return null;

  const config = statusConfig[message.status];
  const isNew = message.status === "NEW";
  const isArchived = message.status === "ARCHIVED";

  const handleMarkAsRead = () => {
    onMarkAsRead?.(message.id);
  };

  const handleArchive = () => {
    onArchive?.(message.id);
  };

  const handleUnarchive = () => {
    onUnarchive?.(message.id);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            Mensaje de Contacto
            <Badge variant={config.variant} className={config.className}>
              {config.label}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Nombre</p>
              <p className="font-medium">{message.name}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Correo</p>
              <a
                href={`mailto:${message.email}`}
                className="font-medium text-blue-600 hover:underline"
              >
                {message.email}
              </a>
            </div>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Fecha</p>
            <p className="font-medium">
              {new Date(message.createdAt).toLocaleString()}
            </p>
          </div>

          <Separator />

          <div>
            <p className="text-sm text-muted-foreground mb-2">Mensaje</p>
            <div className="bg-muted p-4 rounded-lg whitespace-pre-wrap">
              {message.message}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between gap-2">
          <div className="flex gap-2">
            {isNew && onMarkAsRead && (
              <Button
                variant="outline"
                onClick={handleMarkAsRead}
                disabled={isLoading}
              >
                <MailOpen className="mr-2 h-4 w-4" />
                Marcar como Leído
              </Button>
            )}
            {!isArchived && onArchive && (
              <Button
                variant="outline"
                onClick={handleArchive}
                disabled={isLoading}
              >
                <Archive className="mr-2 h-4 w-4" />
                Archivar
              </Button>
            )}
            {isArchived && onUnarchive && (
              <Button
                variant="outline"
                onClick={handleUnarchive}
                disabled={isLoading}
              >
                <ArchiveRestore className="mr-2 h-4 w-4" />
                Desarchivar
              </Button>
            )}
          </div>
          <Button variant="secondary" onClick={handleClose}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
