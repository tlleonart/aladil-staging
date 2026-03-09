"use client";

import {
  AcademicCapIcon,
  BuildingOffice2Icon,
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  HomeIcon,
  NewspaperIcon,
  UserGroupIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { orpc } from "@/modules/core/orpc/client";
import { useQuery } from "@/modules/core/orpc/react";

type NavItem = {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Which roles can see this link. Omit = everyone */
  roles?: Array<"admin" | "director" | "reporter">;
};

const navigation: NavItem[] = [
  {
    name: "Panel",
    href: "/admin",
    icon: HomeIcon,
    roles: ["admin", "director"],
  },
  {
    name: "Noticias",
    href: "/admin/news",
    icon: NewspaperIcon,
    roles: ["admin", "director"],
  },
  {
    name: "Reuniones",
    href: "/admin/meetings",
    icon: CalendarIcon,
    roles: ["admin", "director"],
  },
  {
    name: "Laboratorios",
    href: "/admin/labs",
    icon: BuildingOffice2Icon,
    roles: ["admin", "director"],
  },
  {
    name: "Comité Ejecutivo",
    href: "/admin/executive",
    icon: UserGroupIcon,
    roles: ["admin", "director"],
  },
  { name: "Programa PILA", href: "/admin/pila", icon: AcademicCapIcon },
  {
    name: "Nuevas Tecnologías",
    href: "/admin/new-tech",
    icon: ChatBubbleLeftRightIcon,
    roles: ["admin", "director"],
  },
  { name: "Usuarios", href: "/admin/users", icon: UsersIcon, roles: ["admin"] },
  {
    name: "Contacto",
    href: "/admin/contact",
    icon: EnvelopeIcon,
    roles: ["admin", "director"],
  },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export const Sidebar = ({ open, onClose }: SidebarProps) => {
  const pathname = usePathname();

  const { data: me } = useQuery({
    queryKey: ["users", "me"],
    queryFn: () => orpc.users.me({}),
    staleTime: 5 * 60 * 1000, // cache for 5 min
  });

  const role = me?.effectiveRole ?? "reporter";

  const visibleNav = navigation.filter(
    (item) => !item.roles || item.roles.includes(role),
  );

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-40 bg-black/50 lg:hidden cursor-default"
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
        <div className="flex h-16 items-center justify-center gap-3 border-b border-neutral-200 px-4">
          <Image
            src="/logo.png"
            alt="ALADIL"
            width={36}
            height={36}
            className="shrink-0"
          />
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-bold text-neutral-900 tracking-wide">
              ALADIL
            </span>
            <span className="text-[10px] font-medium uppercase tracking-widest text-neutral-500">
              Intranet
            </span>
          </div>
        </div>

        <nav className="mt-4 px-3 space-y-1">
          {visibleNav.map((item) => {
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
