import {
  useEffect,
  useRef,
  type ReactNode,
} from "react";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  duration?: number;
}

export default function ScrollReveal({
  children,
  className = "",
  delay = 0,
  y = 35,
  duration = 0.7,
}: ScrollRevealProps) {
  const elementRef =
    useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;

    if (!element) {
      return;
    }

    const animation = gsap.fromTo(
      element,
      {
        opacity: 0,
        y,
      },
      {
        opacity: 1,
        y: 0,
        duration,
        delay,
        ease: "power3.out",
        scrollTrigger: {
          trigger: element,
          start: "top 88%",
          once: true,
        },
      }
    );

    return () => {
      animation.kill();

      ScrollTrigger.getAll()
        .filter(
          (trigger) =>
            trigger.trigger === element
        )
        .forEach((trigger) =>
          trigger.kill()
        );
    };
  }, [delay, duration, y]);

  return (
    <div
      ref={elementRef}
      className={className}
    >
      {children}
    </div>
  );
}