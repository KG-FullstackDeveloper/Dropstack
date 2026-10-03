import type { ReactNode } from "react";
import {
  ArrowUpRight,
  ChevronRight,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react";

export interface DashboardBreadcrumb {
  label: string;
  onClick?: () => void;
}

export interface DashboardPageAction {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "secondary" | "ghost";
}

interface DashboardPageShellProps {
  eyebrow?: string;
  title: string;
  description?: string;
  breadcrumbs?: DashboardBreadcrumb[];
  actions?: DashboardPageAction[];
  children: ReactNode;
  loading?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  maxWidth?: "standard" | "wide" | "full";
  childrenClassName?: string;
}

const actionClasses = {
  primary:
    "bg-slate-950 text-white hover:bg-slate-800 border-slate-950",
  secondary:
    "bg-white text-slate-800 hover:bg-slate-50 border-slate-200",
  ghost:
    "bg-transparent text-slate-600 hover:bg-slate-100 border-transparent",
};

function ActionButton({
  action,
}: {
  action: DashboardPageAction;
}) {
  const variant = action.variant || "primary";

const className = `inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition ${actionClasses[variant]}`;

  if (action.href) {
    return (
      <a href={action.href} className={className}>
        {action.icon}
        <span>{action.label}</span>
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={action.onClick}
      className={className}
    >
      {action.icon}
      <span>{action.label}</span>
    </button>
  );
}

function SkeletonBlock({
  className = "",
}: {
  className?: string;
}) {
  return (
    <div
      className={`animate-pulse rounded-2xl bg-slate-100 ${className}`}
    />
  );
}

export function DashboardLoadingState() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <SkeletonBlock className="h-3 w-24" />
        <SkeletonBlock className="h-9 w-64" />
        <SkeletonBlock className="h-4 w-[min(100%,42rem)]" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <SkeletonBlock
            key={index}
            className="h-32"
          />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <SkeletonBlock className="h-80" />
        <SkeletonBlock className="h-80" />
      </div>
    </div>
  );
}

export function DashboardEmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center shadow-sm sm:p-14">
      {icon && (
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          {icon}
        </div>
      )}

      <h2 className="mt-5 text-lg font-black text-slate-950">
        {title}
      </h2>

      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
        {description}
      </p>

      {action && (
        <div className="mt-6 flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
}

export function DashboardStatGrid({
  children,
  columns = "four",
}: {
  children: ReactNode;
  columns?: "two" | "three" | "four";
}) {
  const classes = {
    two: "md:grid-cols-2",
    three: "md:grid-cols-2 xl:grid-cols-3",
    four: "md:grid-cols-2 xl:grid-cols-4",
  };

  return (
    <div className={`grid gap-4 ${classes[columns]}`}>
      {children}
    </div>
  );
}

export function DashboardSection({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      {(title || description || action) && (
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6 md:flex-row md:items-center md:justify-between">
          <div>
            {title && (
              <h2 className="text-base font-black text-slate-950">
                {title}
              </h2>
            )}

            {description && (
              <p className="mt-1 text-sm leading-6 text-slate-500">
                {description}
              </p>
            )}
          </div>

          {action}
        </div>
      )}

      {children}
    </section>
  );
}

export function DashboardTableShell({
  children,
  minWidth = "900px",
}: {
  children: ReactNode;
  minWidth?: string;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <div style={{ minWidth }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function DashboardToolbar({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      {children}
    </div>
  );
}

export function DashboardQuickLink({
  label,
  description,
  icon,
  onClick,
}: {
  label: string;
  description: string;
  icon: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition group-hover:bg-slate-950 group-hover:text-white">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-bold text-slate-950">
          {label}
        </p>

        <p className="mt-1 truncate text-xs text-slate-500">
          {description}
        </p>
      </div>

      <ChevronRight
        size={17}
        className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-slate-600"
      />
    </button>
  );
}

export function DashboardActivityRow({
  icon,
  title,
  description,
  value,
  status,
  onClick,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  value?: string;
  status?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-4 border-b border-slate-100 px-5 py-4 text-left transition last:border-b-0 hover:bg-slate-50 sm:px-6"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-slate-900">
          {title}
        </p>

        {description && (
          <p className="mt-1 truncate text-xs text-slate-400">
            {description}
          </p>
        )}
      </div>

      {status}

      {value && (
        <span className="shrink-0 text-sm font-black text-slate-950">
          {value}
        </span>
      )}

      <ArrowUpRight
        size={16}
        className="shrink-0 text-slate-300"
      />
    </button>
  );
}

export function DashboardMoreButton({
  onClick,
  label = "More options",
}: {
  onClick?: () => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
    >
      <MoreHorizontal size={18} />
    </button>
  );
}

export default function DashboardPageShell({
  eyebrow = "Ecommerce Dashboard",
  title,
  description,
  breadcrumbs,
  actions,
  children,
  loading = false,
  refreshing = false,
  onRefresh,
  maxWidth = "standard",
  childrenClassName = "",
}: DashboardPageShellProps) {
  const widthClasses = {
    standard: "max-w-7xl",
    wide: "max-w-[1440px]",
    full: "max-w-none",
  };

  return (
    <div className="space-y-6">
      {(breadcrumbs && breadcrumbs.length > 0) && (
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 overflow-x-auto text-xs font-semibold text-slate-400"
        >
          {breadcrumbs.map((breadcrumb, index) => (
            <div
              key={`${breadcrumb.label}-${index}`}
              className="flex shrink-0 items-center gap-2"
            >
              {breadcrumb.onClick ? (
                <button
                  type="button"
                  onClick={breadcrumb.onClick}
                  className="transition hover:text-slate-800"
                >
                  {breadcrumb.label}
                </button>
              ) : (
                <span>{breadcrumb.label}</span>
              )}

              {index <
                breadcrumbs.length - 1 && (
                <ChevronRight size={13} />
              )}
            </div>
          ))}
        </nav>
      )}

      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">
            {eyebrow}
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            {title}
          </h1>

          {description && (
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
              {description}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              title="Refresh"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              <span className="hidden sm:inline">
                Refresh
              </span>
            </button>
          )}

          {actions?.map((action, index) => (
            <ActionButton
              key={`${action.label}-${index}`}
              action={action}
            />
          ))}
        </div>
      </header>

      <div
        className={`mx-auto w-full ${widthClasses[maxWidth]} ${childrenClassName}`}
      >
        {loading ? (
          <DashboardLoadingState />
        ) : (
          children
        )}
      </div>
    </div>
  );
}