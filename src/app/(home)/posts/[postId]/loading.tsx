import { Icons } from "~/components/icons";
import { Skeleton } from "~/components/ui/skeleton";

export default function PostModalLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] w-full rounded-none">
      <div className="relative flex-1 basis-0 border-none">
        <Skeleton className="h-full w-full animate-pulse rounded-none border-r border-r-muted-foreground/20 shadow-none" />
        <Icons.placeholder
          className="absolute left-1/2 top-1/2 size-9 -translate-x-1/2 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
      </div>
      <div className="flex w-[450px] flex-col">
        <div className="flex items-center gap-1.5 border-b px-2 py-4">
          <div className="flex items-center gap-2">
            <Skeleton className="size-7 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>

        <div className="h-[calc(100%-8rem)] overflow-y-auto scrollbar-hide">
          {/* Post title section */}
          <div className="px-2 py-4">
            <div className="flex items-start gap-2">
              <Skeleton className="size-7 rounded-full" />
              <div className="flex flex-col gap-1">
                <div className="flex gap-1">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-36" />
                </div>
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          </div>

          {/* Comments loading */}
          <div className="px-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="mb-4 flex items-start gap-2">
                <Skeleton className="size-7 rounded-full" />
                <div className="flex-1">
                  <div className="flex gap-1">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-40" />
                  </div>
                  <Skeleton className="mt-1 h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t py-4">
          <div className="px-2">
            {/* Action buttons */}
            <div className="flex gap-2 pb-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-6" />
              ))}
            </div>
            <Skeleton className="h-3 w-32" />
          </div>
          <div className="my-3 border-b"></div>
          <div className="px-2">
            {/* Add comment section */}
            <div className="flex items-center gap-2">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
