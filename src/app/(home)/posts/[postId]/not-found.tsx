import { ErrorCard } from "~/components/utils/error-card";

export default function ProductModalNotFound() {
  return (
    <ErrorCard
      title="Post not found"
      description="The post may have been removed or you may have entered a broken link"
      retryLink="/"
      retryLinkText="Go to Home"
    />
  );
}
