import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "~/lib/utils";

const skeletonVariants = cva("rounded-md transition-all", {
  variants: {
    variant: {
      default:
        "motion-safe:animate-pulse motion-reduce:animate-none bg-primary/10",
      shimmer:
        "bg-gradient-to-r from-muted/50 via-muted/80 to-muted/50 bg-[length:200%_100%] motion-safe:animate-shine motion-reduce:animate-none motion-reduce:bg-muted/70",
      wave: "bg-gradient-to-r from-muted/30 via-muted/70 to-muted/30 motion-safe:animate-gradient-flow motion-reduce:animate-none motion-reduce:bg-muted/60",
      pulse: "motion-safe:animate-pulse motion-reduce:animate-none bg-muted/60",
      breathe:
        "motion-safe:animate-pulse motion-reduce:animate-none bg-gradient-to-br from-muted/40 to-muted/70",
      "gradient-flow":
        "bg-gradient-to-r from-muted/20 via-primary/20 to-muted/20 bg-[length:200%_100%] motion-safe:animate-gradient-flow motion-reduce:animate-none motion-reduce:bg-muted/50",
    },
    speed: {
      slow: "duration-2000",
      normal: "duration-1500",
      fast: "duration-1000",
    },
  },
  defaultVariants: {
    variant: "shimmer",
    speed: "normal",
  },
});

interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

function Skeleton({
  className,
  variant = "shimmer",
  speed = "normal",
  ...props
}: SkeletonProps) {
  const safeVariant = variant ?? "shimmer";
  const safeSpeed = speed ?? "normal";

  return (
    <div
      className={cn(
        skeletonVariants({ variant: safeVariant, speed: safeSpeed }),
        className,
      )}
      {...props}
    />
  );
}

// CVA variants for specialized skeleton components
const skeletonAvatarVariants = cva("rounded-full", {
  variants: {
    size: {
      sm: "h-8 w-8",
      md: "h-12 w-12",
      lg: "h-16 w-16",
      xl: "h-20 w-20",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

const SkeletonAvatar = ({
  size = "md",
  variant = "shimmer",
  className,
  ...props
}: SkeletonProps & VariantProps<typeof skeletonAvatarVariants>) => {
  const safeSize = size ?? "md";

  return (
    <Skeleton
      variant={variant}
      className={cn(skeletonAvatarVariants({ size: safeSize }), className)}
      {...props}
    />
  );
};

const SkeletonText = ({
  lines = 1,
  variant = "shimmer",
  className,
  ...props
}: SkeletonProps & { lines?: number }) => {
  if (lines === 1) {
    return (
      <Skeleton variant={variant} className={cn("h-4", className)} {...props} />
    );
  }

  return (
    <div className="space-y-2">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton
          key={i}
          variant={variant}
          className={cn(
            "h-4",
            i === lines - 1 ? "w-3/4" : "w-full", // Last line is shorter
            className,
          )}
          style={{ animationDelay: `${i * 100}ms` }}
          {...props}
        />
      ))}
    </div>
  );
};

const SkeletonCard = ({
  variant = "shimmer",
  showAvatar = true,
  showActions = true,
  className,
  ...props
}: SkeletonProps & { showAvatar?: boolean; showActions?: boolean }) => {
  return (
    <div
      className={cn("space-y-4 rounded-lg border p-6", className)}
      {...props}
    >
      {showAvatar && (
        <div className="flex items-center space-x-4">
          <SkeletonAvatar variant={variant} size="md" />
          <div className="flex-1 space-y-2">
            <Skeleton variant={variant} className="h-4 w-1/4" />
            <Skeleton variant={variant} className="h-3 w-1/6" />
          </div>
        </div>
      )}
      <div className="space-y-2">
        <SkeletonText lines={3} variant={variant} />
      </div>
      {showActions && (
        <div className="flex space-x-2 pt-2">
          <Skeleton variant={variant} className="h-8 w-16" />
          <Skeleton variant={variant} className="h-8 w-16" />
          <Skeleton variant={variant} className="h-8 w-16" />
        </div>
      )}
    </div>
  );
};

export {
  Skeleton,
  SkeletonAvatar,
  skeletonAvatarVariants,
  SkeletonCard,
  SkeletonText,
  skeletonVariants,
};
