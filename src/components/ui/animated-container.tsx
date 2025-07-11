import { motion } from "framer-motion";
import * as React from "react";
import { useResizeObserver } from "~/hooks/use-resize-observer";
import { cn } from "~/lib/utils";

type AnimatedSizeContainerProps = React.PropsWithChildren<{
  width?: boolean;
  height?: boolean;
}> &
  Omit<
    React.ComponentPropsWithoutRef<typeof motion.div>,
    "animate" | "children"
  >;

/**
 * A container with animated width and height (each optional) based on children dimensions
 */
const AnimatedSizeContainer = React.forwardRef<
  HTMLDivElement,
  AnimatedSizeContainerProps
>(
  (
    {
      width = false,
      height = false,
      className,
      transition,
      children,
      ...rest
    }: AnimatedSizeContainerProps,
    forwardedRef,
  ) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const resizeObserverEntry = useResizeObserver(containerRef);

    return (
      <motion.div
        ref={forwardedRef}
        className={cn("overflow-hidden", className)}
        animate={{
          width: width
            ? (resizeObserverEntry?.contentRect?.width ?? "auto")
            : "auto",
          height: height
            ? (resizeObserverEntry?.contentRect?.height ?? "auto")
            : "auto",
        }}
        transition={transition ?? { type: "spring", duration: 0.3 }}
        {...rest}
      >
        <div
          ref={containerRef}
          className={cn(height && "h-max", width && "w-max")}
        >
          {children}
        </div>
      </motion.div>
    );
  },
);

AnimatedSizeContainer.displayName = "AnimatedSizeContainer";

export { AnimatedSizeContainer };
