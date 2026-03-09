"use client";

import { Pencil, Plus, Power, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { orpc } from "@/modules/core/orpc/client";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@/modules/core/orpc/react";
import { ConfirmDialog } from "@/modules/shared/ui";
import type { CreatePilaIndicator } from "../schemas";

const emptyIndicator: CreatePilaIndicator = {
  code: "",
  name: "",
  formula: "",
  numeratorLabel: "",
  denominatorLabel: "",
  considerations: "",
  exclusions: "",
  sortOrder: 0,
  isActive: true,
};

export function PilaIndicatorsPage() {
  const queryClient = useQueryClient();
  const [editId, setEditId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CreatePilaIndicator>(emptyIndicator);

  const { data: indicators = [], isLoading } = useQuery({
    queryKey: ["pila", "indicators"],
    queryFn: () => orpc.pila.listIndicators({}),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreatePilaIndicator) => orpc.pila.createIndicator(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pila", "indicators"] });
      setShowCreate(false);
      setForm(emptyIndicator);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreatePilaIndicator }) =>
      orpc.pila.updateIndicator({ id, data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pila", "indicators"] });
      setEditId(null);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => orpc.pila.toggleIndicator({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pila", "indicators"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => orpc.pila.deleteIndicator({ id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pila", "indicators"] });
      setDeleteId(null);
    },
  });

  const openEdit = (indicator: (typeof indicators)[0]) => {
    setForm({
      code: indicator.code,
      name: indicator.name,
      formula: indicator.formula,
      numeratorLabel: indicator.numeratorLabel,
      denominatorLabel: indicator.denominatorLabel,
      considerations: indicator.considerations || "",
      exclusions: indicator.exclusions || "",
      sortOrder: indicator.sortOrder,
      isActive: indicator.isActive,
    });
    setEditId(indicator.id);
  };

  const openCreate = () => {
    setForm({
      ...emptyIndicator,
      sortOrder: indicators.length + 1,
    });
    setShowCreate(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Indicadores PILA</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Indicador
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Indicadores configurados ({indicators.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-8">
              Cargando...
            </p>
          ) : indicators.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay indicadores configurados.
            </p>
          ) : (
            <div className="space-y-3">
              {indicators.map((ind) => (
                <div
                  key={ind.id}
                  className={`flex items-center justify-between rounded-lg border p-4 ${
                    !ind.isActive ? "opacity-50 bg-gray-50" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-blue-700">
                        {ind.code}
                      </span>
                      <span className="text-sm font-medium truncate">
                        {ind.name}
                      </span>
                      {!ind.isActive && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {ind.formula}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 ml-4">
                    <Button
                      size="sm"
                      variant="ghost"
                      title={ind.isActive ? "Desactivar" : "Activar"}
                      onClick={() => toggleMutation.mutate(ind.id)}
                    >
                      <Power
                        className={`h-4 w-4 ${ind.isActive ? "text-green-600" : "text-gray-400"}`}
                      />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      title="Editar"
                      onClick={() => openEdit(ind)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-600"
                      title="Eliminar"
                      onClick={() => setDeleteId(ind.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={showCreate || !!editId}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreate(false);
            setEditId(null);
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editId ? "Editar Indicador" : "Nuevo Indicador"}
            </DialogTitle>
          </DialogHeader>
          <IndicatorForm
            form={form}
            onChange={setForm}
            onSubmit={() => {
              if (editId) {
                updateMutation.mutate({ id: editId, data: form });
              } else {
                createMutation.mutate(form);
              }
            }}
            isLoading={createMutation.isPending || updateMutation.isPending}
            submitLabel={editId ? "Guardar Cambios" : "Crear Indicador"}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Eliminar Indicador"
        description="¿Estás seguro? Se eliminarán todos los datos asociados a este indicador en los reportes existentes."
        confirmText="Eliminar"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
      />
    </div>
  );
}

// ── Indicator Form ────────────────────────────────────────────────

interface IndicatorFormProps {
  form: CreatePilaIndicator;
  onChange: (form: CreatePilaIndicator) => void;
  onSubmit: () => void;
  isLoading: boolean;
  submitLabel: string;
}

function IndicatorForm({
  form,
  onChange,
  onSubmit,
  isLoading,
  submitLabel,
}: IndicatorFormProps) {
  const set = (field: keyof CreatePilaIndicator, value: string | number) =>
    onChange({ ...form, [field]: value });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Código *</Label>
          <Input
            placeholder="I-1"
            value={form.code}
            onChange={(e) => set("code", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>Orden</Label>
          <Input
            type="number"
            min={0}
            value={form.sortOrder}
            onChange={(e) => set("sortOrder", Number(e.target.value))}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Nombre *</Label>
        <Input
          placeholder="Error de ingreso de pacientes"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label>Fórmula *</Label>
        <Input
          placeholder="Errores / Ingresos manuales"
          value={form.formula}
          onChange={(e) => set("formula", e.target.value)}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>Label Numerador *</Label>
          <Input
            placeholder="Cantidad de errores"
            value={form.numeratorLabel}
            onChange={(e) => set("numeratorLabel", e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>Label Denominador *</Label>
          <Input
            placeholder="Total ingresos manuales"
            value={form.denominatorLabel}
            onChange={(e) => set("denominatorLabel", e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label>Consideraciones</Label>
        <Textarea
          rows={3}
          placeholder="Criterios de inclusión..."
          value={form.considerations || ""}
          onChange={(e) => set("considerations", e.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label>Exclusiones</Label>
        <Textarea
          rows={3}
          placeholder="Criterios de exclusión..."
          value={form.exclusions || ""}
          onChange={(e) => set("exclusions", e.target.value)}
        />
      </div>
      <div className="pt-4 border-t">
        <Button onClick={onSubmit} disabled={isLoading} className="w-full">
          {isLoading ? "Guardando..." : submitLabel}
        </Button>
      </div>
    </div>
  );
}
