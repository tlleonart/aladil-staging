import {
  BuildingOffice2Icon,
  CalendarIcon,
  NewspaperIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  { name: "News Posts", value: "-", icon: NewspaperIcon },
  { name: "Meetings", value: "-", icon: CalendarIcon },
  { name: "Labs", value: "-", icon: BuildingOffice2Icon },
  { name: "Executive Members", value: "-", icon: UserGroupIcon },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-neutral-500">
          Welcome to the ALADIL admin dashboard.
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
          <CardTitle>Getting Started</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-neutral-600">
          <p>Use the sidebar to navigate between different sections:</p>
          <ul className="mt-2 list-disc list-inside space-y-1">
            <li>
              <strong>News</strong> - Manage news posts for the website
            </li>
            <li>
              <strong>Meetings</strong> - Manage ALADIL annual meetings
            </li>
            <li>
              <strong>Labs</strong> - Manage member laboratories
            </li>
            <li>
              <strong>Executive</strong> - Manage executive committee members
            </li>
            <li>
              <strong>Users</strong> - Manage admin users and roles
            </li>
            <li>
              <strong>Contact</strong> - View contact form submissions
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
