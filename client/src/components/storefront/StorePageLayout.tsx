import type {
  ReactNode,
} from "react";

interface StorePageLayoutProps {
  children: ReactNode;
  className?: string;
}

export default function StorePageLayout({
  children,
  className = "",
}: StorePageLayoutProps) {
  return (
    <main
      className={`w-full ${className}`}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}