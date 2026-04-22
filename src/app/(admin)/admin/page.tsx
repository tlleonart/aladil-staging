import {
  AcademicCapIcon,
  BuildingOffice2Icon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentPlusIcon,
  NewspaperIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/../convex/_generated/api";
import type { Id } from "@/../convex/_generated/dataModel";
import { requireServerUser } from "@/modules/core/auth/server";
import { createConvexClient } from "@/modules/core/convex/server";

const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

export default async function DashboardPage() {
  const user = await requireServerUser();

  const isAdmin = user.effectiveRole === "admin";
  const isDirector = user.effectiveRole === "director";

  if (isAdmin || isDirector) {
    return <AdminDashboard userName={user.name || "Administrador"} />;
  }

  return (
    <ReporterDashboard
      userName={user.name || "Usuario"}
      labName={user.labName}
      labId={user.labId}
    />
  );
}

// ── Admin Dashboard ──────────────────────────────────────────────

async function AdminDashboard({ userName }: { userName: string }) {
  let newsCount = 0;
  let meetingsCount = 0;
  let labsCount = 0;
  let executiveCount = 0;

  try {
    const convex = await createConvexClient();
    const [news, meetings, labs, execs] = await Promise.all([
      convex.query(api.news.list, { limit: 100 }),
      convex.query(api.meetings.list, { limit: 100 }),
      convex.query(api.labs.list, { limit: 100 }),
      convex.query(api.executive.list, { limit: 100 }),
    ]);
    newsCount = news.length;
    meetingsCount = meetings.length;
    labsCount = labs.length;
    executiveCount = execs.length;
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
  }

  const stats = [
    { name: "Noticias", value: newsCount, icon: NewspaperIcon },
    { name: "Reuniones", value: meetingsCount, icon: CalendarIcon },
    { name: "Laboratorios", value: labsCount, icon: BuildingOffice2Icon },
    { name: "Comité Ejecutivo", value: executiveCount, icon: UserGroupIcon },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hola, {userName}</h1>
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
          <p>
            Usa la barra lateral para navegar entre las diferentes secciones:
          </p>
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li>
              <strong>Noticias</strong> - Administrar noticias del sitio web
            </li>
            <li>
              <strong>Reuniones</strong> - Administrar reuniones anuales de
              ALADIL
            </li>
            <li>
              <strong>Laboratorios</strong> - Administrar laboratorios miembros
            </li>
            <li>
              <strong>Comité Ejecutivo</strong> - Administrar miembros del
              comité ejecutivo
            </li>
            <li>
              <strong>Usuarios</strong> - Administrar usuarios y roles
            </li>
            <li>
              <strong>Contacto</strong> - Ver mensajes del formulario de
              contacto
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Reporter Dashboard ───────────────────────────────────────────

async function ReporterDashboard({
  userName,
  labName,
  labId,
}: {
  userName: string;
  labName: string | null;
  labId: string | null;
}) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const monthName = MONTHS[currentMonth - 1];

  let currentReport: { id: string; status: string } | null = null;
  let recentReports: Array<{
    id: string;
    year: number;
    month: number;
    status: string;
    submittedAt: string | null;
  }> = [];
  let totalSubmitted = 0;

  if (labId) {
    try {
      const convex = await createConvexClient();
      const myReports = await convex.query(api.pila.myReports, {});
      const thisMonth = myReports.find(
        (r) => r.year === currentYear && r.month === currentMonth,
      );
      if (thisMonth) {
        currentReport = { id: thisMonth.id, status: thisMonth.status };
      }
      recentReports = myReports.slice(0, 6).map((r) => ({
        id: r.id,
        year: r.year,
        month: r.month,
        status: r.status,
        submittedAt: r.submittedAt,
      }));
      totalSubmitted = myReports.filter(
        (r) => r.status === "SUBMITTED" || r.status === "REVIEWED",
      ).length;
    } catch (error) {
      console.error("Error fetching reporter dashboard:", error);
    }
  }

  const hasPendingReport = !currentReport;
  const isDraft = currentReport?.status === "DRAFT";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Hola, {userName}</h1>
        {labName && <p className="text-neutral-500">{labName}</p>}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mes Actual</CardTitle>
            <CalendarIcon className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthName}</div>
            <p className="text-xs text-muted-foreground">{currentYear}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Estado del Reporte
            </CardTitle>
            {hasPendingReport || isDraft ? (
              <ClockIcon className="h-4 w-4 text-amber-500" />
            ) : (
              <CheckCircleIcon className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {hasPendingReport
                ? "Pendiente"
                : isDraft
                  ? "Borrador"
                  : currentReport?.status === "SUBMITTED"
                    ? "Enviado"
                    : "Revisado"}
            </div>
            <p className="text-xs text-muted-foreground">
              {monthName} {currentYear}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Reportes Enviados
            </CardTitle>
            <AcademicCapIcon className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubmitted}</div>
            <p className="text-xs text-muted-foreground">Total histórico</p>
          </CardContent>
        </Card>
      </div>

      {(hasPendingReport || isDraft) && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <DocumentPlusIcon className="h-5 w-5 text-amber-600" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  {hasPendingReport
                    ? `Tu reporte de ${monthName} está pendiente`
                    : `Tu reporte de ${monthName} está en borrador`}
                </p>
                <p className="text-xs text-amber-600">
                  {hasPendingReport
                    ? "Creá tu reporte de indicadores para este mes."
                    : "Completá y enviá tu reporte de indicadores."}
                </p>
              </div>
            </div>
            <Button asChild size="sm">
              <Link
                href={
                  hasPendingReport
                    ? "/admin/pila/new"
                    : `/admin/pila/${currentReport?.id}`
                }
              >
                {hasPendingReport ? "Crear Reporte" : "Continuar"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {recentReports.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Reportes Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentReports.map((report) => (
                <Link
                  key={report.id}
                  href={`/admin/pila/${report.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-neutral-50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {MONTHS[report.month - 1]} {report.year}
                    </p>
                    {report.submittedAt && (
                      <p className="text-xs text-muted-foreground">
                        Enviado:{" "}
                        {new Date(report.submittedAt).toLocaleDateString(
                          "es-AR",
                        )}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      report.status === "REVIEWED"
                        ? "bg-green-100 text-green-700"
                        : report.status === "SUBMITTED"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {report.status === "REVIEWED"
                      ? "Revisado"
                      : report.status === "SUBMITTED"
                        ? "Enviado"
                        : "Borrador"}
                  </span>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
