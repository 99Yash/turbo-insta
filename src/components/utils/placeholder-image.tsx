import { AspectRatio } from "@radix-ui/react-aspect-ratio";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "~/lib/utils";
import { Icons } from "../icons";
import { Skeleton } from "../ui/skeleton";

interface PlaceholderImageProps
  extends React.ComponentPropsWithoutRef<typeof AspectRatio> {
  isSkeleton?: boolean;
  asChild?: boolean;
}

export function PlaceholderImage({
  isSkeleton,
  asChild,
  className,
  ...props
}: PlaceholderImageProps) {
  const Comp = asChild ? Slot : AspectRatio;

  return (
    <Comp
      ratio={16 / 9}
      {...props}
      className={cn("overflow-hidden rounded-lg", className)}
    >
      <Skeleton
        aria-label="Placeholder"
        role="img"
        aria-roledescription="placeholder"
        className={cn(
          "flex size-full items-center justify-center",
          isSkeleton ? "animate-pulse" : "animate-none",
        )}
      >
        <Icons.placeholder
          className="size-9 text-muted-foreground"
          aria-hidden="true"
        />
      </Skeleton>
    </Comp>
  );
}
