import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "~/lib/utils";
import { Icons } from "../icons";

// CVA variants for loading spinner
const loadingSpinnerVariants = cva("flex", {
  variants: {
    variant: {
      dots: "space-x-1",
      bars: "space-x-1 items-end",
      spinner: "",
      pulse: "",
      breathe: "",
    },
    size: {
      sm: "w-4 h-4",
      md: "w-6 h-6",
      lg: "w-8 h-8",
      xl: "w-12 h-12",
    },
  },
  defaultVariants: {
    variant: "spinner",
    size: "md",
  },
});

// CVA variants for loading state containers
const loadingStateVariants = cva("", {
  variants: {
    variant: {
      center: "flex flex-col items-center justify-center space-y-4 p-8",
      inline: "flex items-center gap-2",
      card: "rounded-lg border border-border bg-card p-6",
    },
    responsive: {
      true: "motion-safe:animate-fade-in-up motion-reduce:animate-none",
      false: "",
    },
  },
  defaultVariants: {
    variant: "center",
    responsive: true,
  },
});

// CVA variants for skeleton components
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

// CVA variants for responsive layout
const layoutVariants = cva("flex", {
  variants: {
    orientation: {
      horizontal: "flex-row",
      vertical: "flex-col",
      responsive: "flex-col lg:flex-row",
    },
    sidebar: {
      show: "",
      hide: "xl:hidden",
      responsive: "hidden xl:flex",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
    sidebar: "responsive",
  },
});

interface LoadingSpinnerProps
  extends VariantProps<typeof loadingSpinnerVariants> {
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  variant = "spinner",
  className,
}) => {
  const safeSize = size ?? "md";
  const safeVariant = variant ?? "spinner";

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  if (safeVariant === "dots") {
    return (
      <div
        className={cn(
          loadingSpinnerVariants({ variant: safeVariant }),
          className,
        )}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              "motion-safe:animate-loading-dots rounded-full bg-primary motion-reduce:animate-none",
              sizeClasses[safeSize],
            )}
            style={{
              animationDelay: `${i * 0.16}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (safeVariant === "bars") {
    return (
      <div
        className={cn(
          loadingSpinnerVariants({ variant: safeVariant }),
          className,
        )}
      >
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={cn(
              "motion-safe:animate-loading-bars rounded-sm bg-primary motion-reduce:animate-none",
              safeSize === "sm"
                ? "h-3 w-1"
                : safeSize === "md"
                  ? "h-4 w-1.5"
                  : safeSize === "lg"
                    ? "h-6 w-2"
                    : "h-8 w-3",
            )}
            style={{
              animationDelay: `${i * 0.1}s`,
            }}
          />
        ))}
      </div>
    );
  }

  if (safeVariant === "pulse") {
    return (
      <div
        className={cn(
          "rounded-full bg-primary motion-safe:animate-pulse motion-reduce:animate-none",
          sizeClasses[safeSize],
          className,
        )}
      />
    );
  }

  if (safeVariant === "breathe") {
    return (
      <div
        className={cn(
          "motion-safe:animate-loading-breathe rounded-full bg-gradient-to-br from-primary/60 to-primary motion-reduce:animate-none",
          sizeClasses[safeSize],
          className,
        )}
      />
    );
  }

  // Default spinner - use the flexible Icons.loading component
  const sizeMap = {
    sm: { width: 16, height: 16 },
    md: { width: 24, height: 24 },
    lg: { width: 32, height: 32 },
    xl: { width: 48, height: 48 },
  };

  return (
    <Icons.loading
      {...sizeMap[safeSize]}
      className={cn("text-primary", className)}
    />
  );
};

// Enhanced Loading States with CVA
interface LoadingStateProps extends VariantProps<typeof loadingStateVariants> {
  title?: string;
  description?: string;
  className?: string;
  spinnerVariant?: LoadingSpinnerProps["variant"];
}

const LoadingState: React.FC<LoadingStateProps> = ({
  title = "Loading...",
  description,
  className,
  variant = "center",
  responsive = true,
  spinnerVariant = "spinner",
}) => {
  const safeVariant = variant ?? "center";
  const safeResponsive = responsive ?? true;
  const safeSpinnerVariant = spinnerVariant ?? "spinner";

  if (safeVariant === "inline") {
    return (
      <div
        className={cn(
          loadingStateVariants({
            variant: safeVariant,
            responsive: safeResponsive,
          }),
          className,
        )}
      >
        <LoadingSpinner size="sm" variant={safeSpinnerVariant} />
        <span className="text-sm text-muted-foreground">{title}</span>
      </div>
    );
  }

  if (safeVariant === "card") {
    return (
      <div
        className={cn(
          loadingStateVariants({
            variant: safeVariant,
            responsive: safeResponsive,
          }),
          className,
        )}
      >
        <div className="flex flex-col items-center space-y-4">
          <LoadingSpinner size="lg" variant={safeSpinnerVariant} />
          <div className="space-y-2 text-center">
            <h3 className="font-medium">{title}</h3>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Center variant (default)
  return (
    <div
      className={cn(
        loadingStateVariants({
          variant: safeVariant,
          responsive: safeResponsive,
        }),
        className,
      )}
    >
      <LoadingSpinner size="lg" variant={safeSpinnerVariant} />
      <div className="space-y-2 text-center">
        <h3 className="font-medium text-foreground">{title}</h3>
        {description && (
          <p className="max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>
  );
};

// Enhanced skeleton components with CVA
interface SkeletonProps extends VariantProps<typeof skeletonVariants> {
  className?: string;
  style?: React.CSSProperties;
}

const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = "shimmer",
  speed = "normal",
  style,
  ...props
}) => {
  const safeVariant = variant ?? "shimmer";
  const safeSpeed = speed ?? "normal";

  return (
    <div
      className={cn(
        skeletonVariants({ variant: safeVariant, speed: safeSpeed }),
        className,
      )}
      style={style}
      {...props}
    />
  );
};

// Responsive Layout Component
interface ResponsiveLayoutProps extends VariantProps<typeof layoutVariants> {
  children: React.ReactNode;
  className?: string;
}

const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  orientation = "responsive",
  sidebar = "responsive",
  className,
  children,
}) => {
  const safeOrientation = orientation ?? "responsive";
  const safeSidebar = sidebar ?? "responsive";

  return (
    <div
      className={cn(
        layoutVariants({ orientation: safeOrientation, sidebar: safeSidebar }),
        className,
      )}
    >
      {children}
    </div>
  );
};

// Specialized responsive loading components
const MessageLoadingBubble: React.FC<{
  isOwn?: boolean;
  className?: string;
  style?: React.CSSProperties;
}> = ({ isOwn = false, className, style }) => (
  <div
    className={cn("flex", isOwn ? "justify-end" : "justify-start", className)}
    style={style}
  >
    <div
      className={cn(
        "motion-safe:animate-loading-breathe max-w-xs rounded-2xl px-4 py-2 motion-reduce:animate-none",
        isOwn ? "rounded-br-md bg-primary/10" : "rounded-bl-md bg-muted",
      )}
    >
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="motion-safe:animate-loading-dots h-2 w-2 rounded-full bg-current opacity-60 motion-reduce:animate-none"
            style={{ animationDelay: `${i * 0.16}s` }}
          />
        ))}
      </div>
    </div>
  </div>
);

const PostContentLoading: React.FC<{ className?: string }> = ({
  className,
}) => (
  <div className={cn("space-y-4 p-4", className)}>
    {/* Header */}
    <div className="flex items-center space-x-3">
      <Skeleton variant="shimmer" className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-1">
        <Skeleton variant="shimmer" className="h-4 w-24" />
        <Skeleton variant="shimmer" className="h-3 w-16" />
      </div>
    </div>

    {/* Content */}
    <div className="space-y-2">
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton
          key={i}
          variant="shimmer"
          className={cn("h-4", i === 2 ? "w-3/4" : "w-full")}
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </div>

    {/* Image placeholder */}
    <Skeleton variant="shimmer" className="aspect-video rounded-lg" />

    {/* Actions */}
    <div className="flex space-x-4">
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton
          key={i}
          variant="shimmer"
          className="h-8 w-16"
          style={{ animationDelay: `${i * 50}ms` }}
        />
      ))}
    </div>
  </div>
);

const ConversationItemLoading: React.FC<{
  className?: string;
  style?: React.CSSProperties;
}> = ({ className, style }) => (
  <div
    className={cn("flex items-center space-x-3 p-3", className)}
    style={style}
  >
    {/* Avatar with online indicator */}
    <div className="relative">
      <Skeleton variant="shimmer" className="h-12 w-12 rounded-full" />
      <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background">
        <Skeleton variant="shimmer" className="h-full w-full rounded-full" />
      </div>
    </div>

    {/* Content */}
    <div className="flex-1 space-y-1">
      <div className="flex items-center justify-between">
        <Skeleton variant="shimmer" className="h-4 w-20" />
        <Skeleton variant="shimmer" className="h-3 w-12" />
      </div>
      <Skeleton variant="shimmer" className="h-3 w-32" />
    </div>
  </div>
);

const ProfileHeaderLoading: React.FC<{ className?: string }> = ({
  className,
}) => (
  <div
    className={cn(
      "flex flex-col md:flex-row md:items-start md:space-x-8",
      className,
    )}
  >
    {/* Avatar */}
    <div className="mx-auto md:mx-0">
      <Skeleton
        variant="shimmer"
        className="h-24 w-24 rounded-full md:h-36 md:w-36 lg:h-40 lg:w-40"
      />
    </div>

    {/* Profile Info */}
    <div className="mt-4 flex-1 space-y-4 md:mt-0">
      {/* Username and buttons */}
      <div className="flex flex-wrap items-center gap-4">
        <Skeleton variant="shimmer" className="h-7 w-40" />
        <div className="flex gap-2">
          <Skeleton variant="shimmer" className="h-9 w-24" />
          <Skeleton variant="shimmer" className="h-9 w-24" />
        </div>
      </div>

      {/* Stats */}
      <div className="flex space-x-6">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="space-y-1">
            <Skeleton variant="shimmer" className="h-5 w-16" />
            <Skeleton variant="shimmer" className="h-4 w-16" />
          </div>
        ))}
      </div>

      {/* Bio */}
      <div className="space-y-2">
        <Skeleton variant="shimmer" className="h-5 w-48" />
        <Skeleton variant="shimmer" className="h-4 w-full max-w-md" />
        <Skeleton variant="shimmer" className="h-4 w-32" />
      </div>
    </div>
  </div>
);

// Responsive Grid loading for posts
const PostGridLoading: React.FC<{
  count?: number;
  className?: string;
  cols?: 1 | 2 | 3 | 4;
  style?: React.CSSProperties;
}> = ({ count = 9, className, cols = 3, style }) => {
  const gridClasses = {
    1: "grid-cols-1",
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  };

  return (
    <div
      className={cn("grid gap-6", gridClasses[cols], className)}
      style={style}
    >
      {Array.from({ length: count }, (_, i) => (
        <Skeleton
          key={i}
          variant="shimmer"
          className="aspect-square rounded-lg"
          style={{ animationDelay: `${i * 50}ms` }}
        />
      ))}
    </div>
  );
};

// Enhanced Sidebar Loading with responsive design
const SidebarLoading: React.FC<{ className?: string }> = ({ className }) => (
  <div
    className={cn(
      "hidden w-80 border-r border-border/40 bg-background xl:flex",
      className,
    )}
  >
    <div className="flex h-full w-full flex-col">
      {/* Header */}
      <div className="flex h-16 items-center gap-2 border-b border-border/40 px-4">
        <Skeleton variant="shimmer" className="h-8 w-8 rounded" />
        <Skeleton variant="shimmer" className="h-6 w-32" />
      </div>

      {/* Navigation items */}
      <div className="space-y-3 p-4">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="motion-safe:animate-stagger-in flex items-center gap-3 motion-reduce:animate-none"
            style={{ animationDelay: `${(i + 2) * 100}ms` }}
          >
            <Skeleton variant="shimmer" className="h-6 w-6 rounded" />
            <Skeleton variant="shimmer" className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

export {
  ConversationItemLoading,
  layoutVariants,
  LoadingSpinner,
  loadingSpinnerVariants,
  LoadingState,
  loadingStateVariants,
  MessageLoadingBubble,
  PostContentLoading,
  PostGridLoading,
  ProfileHeaderLoading,
  ResponsiveLayout,
  SidebarLoading,
  Skeleton,
  skeletonVariants,
};
