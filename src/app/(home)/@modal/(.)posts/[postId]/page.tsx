import { EnterFullScreenIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { AlertDialogAction } from "~/components/ui/alert-dialog";
import { buttonVariants } from "~/components/ui/button";
import { DialogShell } from "~/components/utils/dialog-shell";
import { cn } from "~/lib/utils";

interface PostModalPageProps {
  params: {
    postId: string;
  };
}

export default async function PostModalPage({ params }: PostModalPageProps) {
  return (
    <DialogShell className="flex flex-col gap-2 overflow-visible sm:flex-row">
      <AlertDialogAction
        className={cn(
          buttonVariants({
            variant: "ghost",
            size: "icon",
            className:
              "absolute right-10 top-4 h-auto w-auto shrink-0 rounded-sm bg-transparent p-0 text-foreground opacity-70 ring-offset-background transition-opacity hover:bg-transparent hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground",
          }),
        )}
        asChild
      >
        <Link replace href={`/product/${params.postId}`}>
          <EnterFullScreenIcon className="size-4" aria-hidden="true" />
        </Link>
      </AlertDialogAction>
      {/* <AspectRatio ratio={16 / 9} className="w-full">
        {product.images?.length ? (
          <Image
            src={product.images[0]?.url ?? "/images/product-placeholder.webp"}
            alt={product.images[0]?.name ?? product.name}
            className="object-cover"
            sizes="(min-width: 1024px) 20vw, (min-width: 768px) 25vw, (min-width: 640px) 33vw, (min-width: 475px) 50vw, 100vw"
            fill
            loading="lazy"
          />
        ) : (
          <PlaceholderImage className="rounded-none" asChild />
        )}
      </AspectRatio> */}
      <div className="w-full space-y-6 p-6 sm:p-10">
        {/* <div className="space-y-2">
          <h1 className="line-clamp-2 text-2xl font-bold">{product.name}</h1>
          <p className="text-base text-muted-foreground">
            {formatPrice(product.price)}
          </p>
          <Rating rating={Math.round(product.rating / 5)} />
          <p className="text-base text-muted-foreground">
            {product.inventory} in stock
          </p>
        </div>
        <p className="line-clamp-4 text-base text-muted-foreground">
          {product.description}
        </p> */}
      </div>
    </DialogShell>
  );
}
