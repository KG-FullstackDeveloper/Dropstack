interface StoreCategoryCardProps {
  title: string;
  description?: string;
  imageUrl?: string | null;
  onClick?: () => void;
}

export default function StoreCategoryCard({
  title,
  description,
  imageUrl,
  onClick,
}: StoreCategoryCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative min-h-[260px] overflow-hidden rounded-2xl bg-slate-100 text-left dark:bg-slate-900"
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={title}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
      ) : null}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 p-5 text-white">
        <h3 className="text-lg font-bold">
          {title}
        </h3>

        {description && (
          <p className="mt-1 text-sm text-white/80">
            {description}
          </p>
        )}
      </div>
    </button>
  );
}