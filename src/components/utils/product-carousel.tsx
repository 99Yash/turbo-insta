"use client";

import { ChevronRightIcon } from "@radix-ui/react-icons";
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react";
import Image from "next/image";
import * as React from "react";
import { cn } from "~/lib/utils";
import { type StoredFile } from "~/types";
import { Icons } from "../icons";
import { Button } from "../ui/button";

type CarouselApi = UseEmblaCarouselType["1"];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters["0"];

interface ProductImageCarouselProps
  extends React.HTMLAttributes<HTMLDivElement> {
  files: StoredFile[] | null;
  options?: CarouselOptions;
}

export function ProductImageCarousel({
  files,
  className,
  options,
  ...props
}: ProductImageCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(options);

  const [prevBtnDisabled, setPrevBtnDisabled] = React.useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = React.useState(true);

  const scrollPrev = React.useCallback(
    () => emblaApi && emblaApi.scrollPrev(),
    [emblaApi],
  );
  const scrollNext = React.useCallback(
    () => emblaApi && emblaApi.scrollNext(),
    [emblaApi],
  );

  const onSelect = React.useCallback((emblaApi: CarouselApi) => {
    if (!emblaApi) return;

    setPrevBtnDisabled(!emblaApi.canScrollPrev());
    setNextBtnDisabled(!emblaApi.canScrollNext());
  }, []);

  React.useEffect(() => {
    if (!emblaApi) return;

    onSelect(emblaApi);
    emblaApi.on("reInit", onSelect);
    emblaApi.on("select", onSelect);
  }, [emblaApi, onSelect]);

  if (!files || files.length === 0) {
    return null;
  }

  return (
    <div
      aria-label="Product image carousel"
      className={cn("relative flex flex-[0_0_40%] flex-col gap-4", className)}
      {...props}
    >
      <Button
        variant="outline"
        size="icon"
        aria-label="Previous slide"
        className={cn(
          "absolute left-1.5 top-1/2 z-20 mr-0.5 aspect-square size-7 rounded-full text-muted-foreground opacity-90 sm:mr-2 sm:size-8",
          prevBtnDisabled && "hidden",
        )}
        onClick={scrollPrev}
      >
        <Icons.chevronLeft className="size-3" aria-hidden="true" />
        <span className="sr-only">Previous slide</span>
      </Button>
      <div ref={emblaRef} className="overflow-hidden">
        <div
          className="flex touch-pan-y"
          style={{
            backfaceVisibility: "hidden",
          }}
        >
          {files.map((f, index) => (
            <section
              className="relative aspect-square min-w-0 flex-[0_0_100%] border-muted-foreground/20"
              key={f.url}
            >
              <Image
                aria-label={`Slide ${index + 1} of ${files.length}`}
                role="group"
                key={index}
                aria-roledescription="slide"
                src={f.url}
                alt={`Listing product image ${index + 1} of ${files.length}`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-contain"
                priority={index === 0}
              />
            </section>
          ))}
        </div>
      </div>
      <Button
        variant="outline"
        size="icon"
        className={cn(
          "absolute right-1.5 top-1/2 z-20 ml-0.5 aspect-square size-7 rounded-full text-muted-foreground opacity-90 sm:ml-2 sm:size-8",
          nextBtnDisabled && "hidden",
        )}
        onClick={scrollNext}
      >
        <ChevronRightIcon className="size-3" aria-hidden="true" />
        <span className="sr-only">Next slide</span>
      </Button>
    </div>
  );
}
