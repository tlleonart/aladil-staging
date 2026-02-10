import {
  BuildingOffice2Icon,
  CalendarIcon,
  NewspaperIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/modules/core/db";

export default async function DashboardPage() {
  const [newsCount, meetingsCount, labsCount, executiveCount] =
    await Promise.all([
      prisma.newsPost.count(),
      prisma.meeting.count(),
      prisma.lab.count(),
      prisma.executiveMember.count(),
    ]);

  const stats = [
    { name: "Noticias", value: newsCount, icon: NewspaperIcon },
    { name: "Reuniones", value: meetingsCount, icon: CalendarIcon },
    { name: "Laboratorios", value: labsCount, icon: BuildingOffice2Icon },
    { name: "Comité Ejecutivo", value: executiveCount, icon: UserGroupIcon },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Panel de Control</h1>
        <p className="text-neutral-500">
          Bienvenido al panel de administración de ALADIL.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.name}</CardTitle>
              <stat.icon className="h-4 w-4 text-neutral-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Primeros Pasos</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-neutral-600">
          <p>Usa la barra lateral para navegar entre las diferentes secciones:</p>
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li>
              <strong>Noticias</strong> - Administrar noticias del sitio web
            </li>
            <li>
              <strong>Reuniones</strong> - Administrar reuniones anuales de ALADIL
            </li>
            <li>
              <strong>Laboratorios</strong> - Administrar laboratorios miembros
            </li>
            <li>
              <strong>Comité Ejecutivo</strong> - Administrar miembros del comité ejecutivo
            </li>
            <li>
              <strong>Usuarios</strong> - Administrar usuarios y roles
            </li>
            <li>
              <strong>Contacto</strong> - Ver mensajes del formulario de contacto
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
