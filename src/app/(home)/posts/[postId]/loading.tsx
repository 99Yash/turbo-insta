import { PlaceholderImage } from "~/components/utils/placeholder-image";

export default function ProductModalLoading() {
  return (
    <div className="flex h-[calc(100vh-8rem)] w-full gap-2">
      <div className="relative flex-1 basis-0">
        <PlaceholderImage className="h-full rounded-none border-r" />
      </div>
    </div>
  );
}
