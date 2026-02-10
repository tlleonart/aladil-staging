"use client";

import { Card, CardContent } from "@/components/ui/card";
import { WrenchScrewdriverIcon } from "@heroicons/react/24/outline";

export const PilaPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Programa PILA</h1>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <WrenchScrewdriverIcon className="h-12 w-12 text-neutral-400 mb-4" />
          <p className="text-lg font-medium text-neutral-600">
            Página en construcción
          </p>
          <p className="text-sm text-neutral-400 mt-1">
            Esta sección estará disponible próximamente.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
