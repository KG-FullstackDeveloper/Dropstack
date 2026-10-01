import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  addToast: (message: string, type?: ToastType) => void;
}

export const ToastContext = createContext<ToastContextValue>({
  addToast: () => {},
});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}

      {/* Toast container */}
      <div className="fixed right-4 top-4 z-[100] flex flex-col gap-3 sm:right-6 sm:top-6">
        {toasts.map((toast) => {
          const styles: Record<ToastType, { border: string; bg: string; text: string }> = {
            success: {
              border: "border-l-emerald-500",
              bg: "bg-white",
              text: "text-slate-800",
            },
            error: {
              border: "border-l-red-500",
              bg: "bg-white",
              text: "text-slate-800",
            },
            info: {
              border: "border-l-blue-500",
              bg: "bg-white",
              text: "text-slate-800",
            },
          };

          const Icon =
            toast.type === "success"
              ? CheckCircle2
              : toast.type === "error"
                ? XCircle
                : Info;

          const iconColor =
            toast.type === "success"
              ? "text-emerald-500"
              : toast.type === "error"
                ? "text-red-500"
                : "text-blue-500";

          const s = styles[toast.type];

          return (
            <div
              key={toast.id}
              className={`flex w-80 items-start gap-3 rounded-xl border border-l-4 p-4 shadow-lg ${s.border} ${s.bg} ${s.text}`}
            >
              <Icon size={18} className={`mt-0.5 shrink-0 ${iconColor}`} />
              <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
              <button
                onClick={() => dismiss(toast.id)}
                className="ml-1 shrink-0 rounded-md p-0.5 text-slate-400 hover:text-slate-700"
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
