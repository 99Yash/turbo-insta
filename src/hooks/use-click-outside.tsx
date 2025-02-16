import * as React from "react";

interface UseClickOutsideProps {
  ref: React.RefObject<HTMLElement>;
  handler: (event: MouseEvent | TouchEvent) => void;
}

export function useClickOutside({ ref, handler }: UseClickOutsideProps) {
  React.useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      const el = ref?.current;
      if (!el || el.contains((event?.target as Node) || null)) {
        return;
      }
      handler(event);
    };
    window.addEventListener("mousedown", listener);
    window.addEventListener("touchstart", listener);
    return () => {
      window.removeEventListener("mousedown", listener);
      window.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}
