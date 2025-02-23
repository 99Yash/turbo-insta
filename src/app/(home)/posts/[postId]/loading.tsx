import { Skeleton } from "~/components/ui/skeleton";
import { PlaceholderImage } from "~/components/utils/placeholder-image";

export default function ProductModalLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] w-full gap-2">
      <div className="relative flex-1 basis-0">
        <PlaceholderImage className="h-full rounded-none border-r" />
      </div>
      <div className="flex w-full basis-[450px] flex-col">
        <div className="flex items-center gap-1.5 border-b px-4 py-3">
          <Skeleton className="size-7 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>

        <div className="scrollbar-hide h-[calc(100%-8rem)] overflow-y-auto p-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="mb-6 flex items-start gap-2">
              <Skeleton className="size-7 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>

        <div className="border-t bg-background px-2 py-3">
          <div className="mb-3 flex gap-2">
            <Skeleton className="size-6" />
            <Skeleton className="size-6" />
            <Skeleton className="size-6" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-8 flex-1 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
