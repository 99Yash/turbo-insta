import { type ComponentPropsWithoutRef, type ElementType } from "react";
import { cn } from "~/lib/utils";

interface StarBorderProps<T extends ElementType> {
  as?: T;
  color?: string;
  speed?: string;
  className?: string;
  children: React.ReactNode;
}

export function StarBorder<T extends ElementType = "button">({
  as,
  className,
  color,
  speed = "2.5s",
  children,
  ...props
}: StarBorderProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof StarBorderProps<T>>) {
  const Component = as ?? "button";
  const defaultColor = color ?? "hsl(var(--foreground))";

  return (
    <Component
      className={cn(
        "relative inline-block overflow-hidden rounded-[20px] py-[1px]",
        className,
      )}
      {...props}
    >
      <div
        className={cn(
          "absolute bottom-[-11px] right-[-250%] z-0 h-[50%] w-[300%] animate-star-movement-bottom rounded-full",
          "opacity-20 dark:opacity-70",
        )}
        style={{
          background: `radial-gradient(circle, ${defaultColor}, transparent 20%)`,
          animationDuration: speed,
        }}
      />
      <div
        className={cn(
          "absolute left-[-250%] top-[-10px] z-0 h-[50%] w-[300%] animate-star-movement-top rounded-full",
          "opacity-20 dark:opacity-70",
        )}
        style={{
          background: `radial-gradient(circle, ${defaultColor}, transparent 20%)`,
          animationDuration: speed,
        }}
      />
      <div
        className={cn(
          "z-1 relative rounded-[20px] border px-6 py-4 text-center text-base text-foreground",
          "border-border/40 bg-gradient-to-b from-background to-muted-foreground",
          "dark:border-border dark:from-background dark:to-muted",
          "flex items-center justify-center gap-2",
        )}
      >
        {children}
      </div>
    </Component>
  );
}
