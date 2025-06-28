import { PostGridLoading, ProfileHeaderLoading } from "~/components/ui/loading";
import { Skeleton } from "~/components/ui/skeleton";

export default function ProfileLoading() {
  return (
    <div className="animate-fade-in-up container mx-auto max-w-4xl py-8">
      {/* Enhanced Profile Header Loading */}
      <ProfileHeaderLoading className="animate-stagger-in" />

      {/* Enhanced Profile Tabs Loading */}
      <div className="mt-8 border-t pt-4">
        <div className="flex justify-center">
          <div className="flex space-x-6">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton
                key={i}
                variant="shimmer"
                className="animate-stagger-in h-8 w-20"
                style={{ animationDelay: `${(i + 1) * 100}ms` }}
              />
            ))}
          </div>
        </div>

        {/* Enhanced Posts Grid Loading with staggered animations */}
        <PostGridLoading
          count={9}
          cols={3}
          className="animate-stagger-in mt-6"
        />
      </div>
    </div>
  );
}
