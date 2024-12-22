import { ErrorCard } from "~/components/utils/error-card";
import { Shell } from "~/components/utils/shell";

export default function ProductModalNotFound() {
  return (
    <Shell variant="centered" className="max-w-md">
      <ErrorCard
        title="Post not found"
        description="The post may have been removed or you may have entered a broken link"
        retryLink="/"
        retryLinkText="Go to Home"
      />
    </Shell>
  );
}
