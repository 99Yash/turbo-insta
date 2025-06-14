import { Skeleton } from "~/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="container mx-auto max-w-4xl py-8">
      {/* Profile Header Loading */}
      <div className="flex flex-col items-center md:flex-row md:items-start md:space-x-8">
        <Skeleton className="size-24 rounded-full md:size-36 lg:size-40" />

        <div className="mt-4 flex w-full flex-1 flex-col md:mt-0">
          <div className="flex flex-wrap items-center gap-4">
            <Skeleton className="h-7 w-40" />

            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>

          <div className="mt-4 flex space-x-6">
            <div className="flex flex-col gap-1">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex flex-col gap-1">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="flex flex-col gap-1">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>

          <div className="mt-4">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="mt-2 h-4 w-full max-w-md" />
          </div>
        </div>
      </div>

      {/* Profile Tabs Loading */}
      <div className="mt-8 border-t pt-4">
        <div className="flex justify-center">
          <div className="flex space-x-6">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-20" />
          </div>
        </div>

        {/* Posts Grid Loading */}
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
