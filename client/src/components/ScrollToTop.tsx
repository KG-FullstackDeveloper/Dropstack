import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 500);
    };

    window.addEventListener("scroll", handleScroll);

    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!visible) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Scroll to top"
      className="
        fixed
        bottom-6
        left-6
        z-[90]
        flex
        h-11
        w-11
        items-center
        justify-center
        rounded-full
        border
        border-slate-200
        bg-white
        text-slate-800
        shadow-lg
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-xl
        dark:border-slate-700
        dark:bg-slate-900
        dark:text-white
      "
    >
      <ArrowUp size={18} />
    </button>
  );
}