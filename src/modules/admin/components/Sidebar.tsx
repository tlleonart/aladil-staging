"use client";

import {
  BuildingOffice2Icon,
  CalendarIcon,
  EnvelopeIcon,
  HomeIcon,
  NewspaperIcon,
  UserGroupIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Panel", href: "/admin", icon: HomeIcon },
  { name: "Noticias", href: "/admin/news", icon: NewspaperIcon },
  { name: "Reuniones", href: "/admin/meetings", icon: CalendarIcon },
  { name: "Laboratorios", href: "/admin/labs", icon: BuildingOffice2Icon },
  { name: "Comité Ejecutivo", href: "/admin/executive", icon: UserGroupIcon },
  { name: "Usuarios", href: "/admin/users", icon: UsersIcon },
  { name: "Contacto", href: "/admin/contact", icon: EnvelopeIcon },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export const Sidebar = ({ open, onClose }: SidebarProps) => {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-white border-r border-neutral-200 transition-transform duration-200 ease-in-out lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-center border-b border-neutral-200">
          <h1 className="text-xl font-bold text-neutral-900">ALADIL Admin</h1>
        </div>

        <nav className="mt-4 px-3 space-y-1">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-neutral-100 text-neutral-900"
                    : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900",
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
};
