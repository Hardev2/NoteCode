export default function CollapsibleSection({
  label,
  collapsed,
  onToggle,
  headerActions,
  children,
  shellClassName,
  headerClassName,
  preview,
}) {
  return (
    <div className={shellClassName}>
      <div className={headerClassName}>
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-400/60 dark:focus-visible:ring-slate-500"
          aria-expanded={!collapsed}
        >
          <span className="w-3 shrink-0 text-[10px] text-stone-400 dark:text-slate-500" aria-hidden>
            {collapsed ? "▶" : "▼"}
          </span>
          <span className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-slate-400">
            {label}
          </span>
          {collapsed && preview ? (
            <span className="min-w-0 truncate text-xs font-normal normal-case tracking-normal text-stone-400 dark:text-slate-500">
              {preview}
            </span>
          ) : null}
        </button>
        {headerActions}
      </div>
      {!collapsed ? children : null}
    </div>
  );
}
