"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useOrganization, useUser } from "@clerk/nextjs";
import {
  LayoutDashboard, Users, TrendingUp, Megaphone, FileText,
  Settings as SettingsIcon, Search, ChevronDown, Upload,
  GitBranch, BookOpen, Activity, Bell, Building2, BarChart3,
  Package, MapPin, Plug, FlaskConical, Menu, X,
} from "lucide-react";
import { type ReactNode, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const navGroups = [
  {
    label: "Dashboard",
    items: [
      { label: "Overview",           href: "/overview",          icon: LayoutDashboard },
      { label: "Analytics",          href: "/analytics",         icon: BarChart3 },
      { label: "Future Predictions", href: "/data-science",      icon: FlaskConical },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Customers",          href: "/customers",         icon: Users },
      { label: "Customer Analytics", href: "/customer-analytics",icon: Users },
      { label: "Organizations",      href: "/organizations",     icon: Building2 },
    ],
  },
  {
    label: "Revenue",
    items: [
      { label: "Sales",              href: "/sales",             icon: TrendingUp },
      { label: "Marketing",          href: "/marketing",         icon: Megaphone },
      { label: "Products",           href: "/products",          icon: Package },
      { label: "Branches",           href: "/branches",          icon: MapPin },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Reports",            href: "/reports",           icon: FileText },
      { label: "CSV Imports",        href: "/imports",           icon: Upload },
      { label: "Resume Library",     href: "/resumes",           icon: BookOpen },
      { label: "GitHub Analysis",    href: "/github",            icon: GitBranch },
    ],
  },
  {
    label: "Platform",
    items: [
      { label: "Data Sources",       href: "/data-sources",      icon: Plug },
      { label: "Activity Logs",      href: "/activity",          icon: Activity },
    ],
  },
];

export function DashboardLayout({ children, action }: { children: ReactNode; action?: ReactNode }) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { organization } = useOrganization();
  const { user } = useUser();
  const workspaceName = organization?.name ?? user?.fullName ?? "My Workspace";

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const isActive = (href: string) =>
    href === "/overview"
      ? pathname === "/overview"
      : pathname === href || pathname.startsWith(href + "/");

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="px-5 py-4 border-b border-zinc-950/5">
        <Link href="/overview" className="flex items-center gap-2.5">
          <div className="size-7 bg-brand rounded-[5px] flex items-center justify-center shrink-0">
            <BarChart3 className="size-4 text-white" strokeWidth={2} />
          </div>
          <div>
            <span className="font-semibold tracking-tight text-sm leading-none block">
              Nexus Analytics
            </span>
            <span className="text-[9px] text-zinc-400 font-medium uppercase tracking-wider">
              Enterprise
            </span>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1 text-[9px] font-semibold text-zinc-400 uppercase tracking-widest">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={true}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 text-sm rounded-md transition-all duration-150",
                      active
                        ? "bg-brand/10 text-brand font-medium"
                        : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-950/[0.04]",
                    )}
                  >
                    <Icon
                      className={cn("size-4 shrink-0", active ? "text-brand" : "text-zinc-400")}
                      strokeWidth={active ? 2 : 1.75}
                    />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-zinc-950/5 space-y-0.5">
        <Link href="/settings/org"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 text-sm rounded-md transition-colors",
            pathname.startsWith("/settings")
              ? "bg-zinc-950/5 text-zinc-900 font-medium"
              : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-950/[0.03]",
          )}>
          <SettingsIcon className={cn("size-4 shrink-0", pathname.startsWith("/settings") ? "text-zinc-700" : "text-zinc-400")} strokeWidth={1.75} />
          Settings
        </Link>
        <Link href="/profile"
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 text-sm rounded-md transition-colors",
            pathname === "/profile"
              ? "bg-zinc-950/5 text-zinc-900 font-medium"
              : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-950/[0.03]",
          )}>
          <Users className={cn("size-4 shrink-0", pathname === "/profile" ? "text-zinc-700" : "text-zinc-400")} strokeWidth={1.75} />
          Profile
        </Link>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex w-full">

      {/* ── DESKTOP SIDEBAR (hidden on mobile) ───────────────────────────── */}
      <aside className="hidden lg:flex w-60 border-r border-zinc-950/5 flex-col shrink-0 bg-surface fixed top-0 left-0 h-full z-20">
        <SidebarContent />
      </aside>

      {/* ── MOBILE SIDEBAR DRAWER ─────────────────────────────────────────── */}
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          {/* Drawer */}
          <aside className="fixed top-0 left-0 h-full w-72 bg-surface z-50 flex flex-col shadow-2xl lg:hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-950/5">
              <Link href="/overview" className="flex items-center gap-2.5">
                <div className="size-7 bg-brand rounded-[5px] flex items-center justify-center">
                  <BarChart3 className="size-4 text-white" strokeWidth={2} />
                </div>
                <span className="font-semibold text-sm">Nexus Analytics</span>
              </Link>
              <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-md text-zinc-400 hover:text-zinc-700">
                <X className="size-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
              {navGroups.map((group) => (
                <div key={group.label}>
                  <p className="px-3 mb-1 text-[9px] font-semibold text-zinc-400 uppercase tracking-widest">{group.label}</p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <Link key={item.href} href={item.href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-3 text-sm rounded-md transition-all",
                            active ? "bg-brand/10 text-brand font-medium" : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100",
                          )}>
                          <Icon className={cn("size-5 shrink-0", active ? "text-brand" : "text-zinc-400")} strokeWidth={active ? 2 : 1.75} />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>
            <div className="p-3 border-t border-zinc-950/5 space-y-0.5">
              <Link href="/settings/org" className="flex items-center gap-3 px-3 py-3 text-sm rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100">
                <SettingsIcon className="size-5 shrink-0 text-zinc-400" strokeWidth={1.75} />Settings
              </Link>
              <Link href="/profile" className="flex items-center gap-3 px-3 py-3 text-sm rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100">
                <Users className="size-5 shrink-0 text-zinc-400" strokeWidth={1.75} />Profile
              </Link>
            </div>
          </aside>
        </>
      )}

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-60">
        {/* Topbar */}
        <header className="h-14 border-b border-zinc-950/5 px-4 lg:px-6 flex items-center justify-between shrink-0 bg-surface sticky top-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
            >
              <Menu className="size-5" />
            </button>

            {/* Workspace badge — hidden on smallest screens */}
            <button className="hidden sm:flex items-center gap-2 px-2.5 py-1.5 bg-zinc-100 rounded-md ring-1 ring-black/5 hover:bg-zinc-50 transition-colors">
              <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider hidden md:inline">
                Workspace
              </span>
              <span className="text-xs font-semibold truncate max-w-[100px] lg:max-w-[140px]">
                {workspaceName}
              </span>
              <ChevronDown className="size-3 text-zinc-400 shrink-0" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Search — only on large screens */}
            <div className="relative hidden xl:block">
              <Search className="size-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                placeholder="Search customers, reports…"
                className="text-xs bg-zinc-100 rounded-md ring-1 ring-black/5 pl-7 pr-3 py-1.5 w-56 outline-none focus:ring-brand/40 focus:bg-white transition-colors"
              />
            </div>
            <NotificationBell />
            {action}
            <UserButton appearance={{ elements: { avatarBox: "size-8 ring-1 ring-black/5" } }} />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

// ── Notification Bell ─────────────────────────────────────────────────────────

const INITIAL_NOTIFICATIONS = [
  { id: 1, title: "Import complete",  body: "142 customers imported successfully",               time: "2m ago",  read: false },
  { id: 2, title: "Churn alert",      body: "SMB High Churn cohort recency slipped below threshold", time: "1h ago",  read: false },
  { id: 3, title: "Report ready",     body: "Q4 2024 Executive Review PDF generated",             time: "3h ago",  read: true  },
  { id: 4, title: "New team member",  body: "dana@acme.com joined as Viewer",                    time: "1d ago",  read: true  },
];

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const unread = notifications.filter((n) => !n.read).length;
  const markAllRead = () => setNotifications((ns) => ns.map((n) => ({ ...n, read: true })));
  const markRead = (id: number) => setNotifications((ns) => ns.map((n) => n.id === id ? { ...n, read: true } : n));

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative size-8 flex items-center justify-center rounded-md text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
      >
        <Bell className="size-4" strokeWidth={1.75} />
        {unread > 0 && <span className="absolute top-1 right-1 size-2 bg-brand rounded-full ring-2 ring-white" />}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 w-80 max-w-[calc(100vw-2rem)] bg-surface rounded-xl shadow-xl ring-1 ring-black/10 z-40 overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-950/5 flex items-center justify-between">
              <p className="text-sm font-semibold">Notifications</p>
              {unread > 0 && <span className="text-[10px] font-medium text-brand bg-brand/10 px-1.5 py-0.5 rounded-full">{unread} new</span>}
            </div>
            <div className="divide-y divide-zinc-950/5 max-h-72 overflow-y-auto">
              {notifications.map((n) => (
                <div key={n.id} onClick={() => markRead(n.id)}
                  className={cn("px-4 py-3 hover:bg-zinc-50 transition-colors cursor-pointer", !n.read && "bg-brand/[0.03]")}>
                  <div className="flex items-start gap-2">
                    {!n.read && <div className="size-1.5 bg-brand rounded-full mt-1.5 shrink-0" />}
                    <div className={cn("flex-1", n.read && "ml-3.5")}>
                      <p className="text-xs font-semibold text-zinc-900">{n.title}</p>
                      <p className="text-xs text-zinc-500 mt-0.5">{n.body}</p>
                      <p className="text-[10px] text-zinc-400 mt-1">{n.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-4 py-2.5 border-t border-zinc-950/5">
              <button onClick={markAllRead} disabled={unread === 0}
                className="text-xs text-brand hover:underline disabled:opacity-40 disabled:cursor-not-allowed">
                Mark all as read
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
