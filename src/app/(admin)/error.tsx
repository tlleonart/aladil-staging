"use client";

import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error del servidor</AlertTitle>
          <AlertDescription>
            Ocurrió un error al procesar tu solicitud. Esto puede deberse a un
            problema temporal de conexión con la base de datos.
          </AlertDescription>
        </Alert>
        {error.digest && (
          <p className="text-xs text-neutral-400 text-center">
            Ref: {error.digest}
          </p>
        )}
        <div className="flex items-center justify-center gap-3">
          <Button onClick={reset}>Reintentar</Button>
          <Button variant="outline" asChild>
            <a href="/admin">Ir al panel</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
