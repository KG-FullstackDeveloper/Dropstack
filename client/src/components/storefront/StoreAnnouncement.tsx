import { X } from "lucide-react";
import { useState } from "react";

import type { StoreConfig } from "../../types/store";

interface StoreAnnouncementProps {
  store: StoreConfig;
}

export default function StoreAnnouncement({
  store,
}: StoreAnnouncementProps) {
  const [visible, setVisible] =
    useState(true);

  if (
    !store.settings.showAnnouncementBar ||
    !visible
  ) {
    return null;
  }

  return (
    <div
      className="relative px-10 py-2.5 text-center text-xs font-medium text-white sm:text-sm"
      style={{
        backgroundColor:
          store.accentColor ||
          "#2563eb",
      }}
    >
      <span>
        Free shipping on selected
        orders. Shop now.
      </span>

      <button
        type="button"
        aria-label="Close announcement"
        onClick={() =>
          setVisible(false)
        }
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 transition hover:bg-white/10"
      >
        <X size={15} />
      </button>
    </div>
  );
}