interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function SectionHeading({
  eyebrow,
  title,
  description,
  actionLabel,
  onAction,
}: SectionHeadingProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            {eyebrow}
          </p>
        )}

        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl dark:text-white">
          {title}
        </h2>

        {description && (
          <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="w-fit text-sm font-semibold text-slate-900 hover:underline dark:text-white"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}