"use client";

import { ChevronRightIcon } from "@radix-ui/react-icons";
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react";
import Image from "next/image";
import * as React from "react";
import { cn, isImageUrl } from "~/lib/utils";
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
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  const scrollPrev = React.useCallback(
    () => emblaApi && emblaApi.scrollPrev(),
    [emblaApi],
  );
  const scrollNext = React.useCallback(
    () => emblaApi && emblaApi.scrollNext(),
    [emblaApi],
  );
  const scrollTo = React.useCallback(
    (index: number) => emblaApi && emblaApi.scrollTo(index),
    [emblaApi],
  );

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === "ArrowLeft") {
        scrollPrev();
      } else if (event.key === "ArrowRight") {
        scrollNext();
      }
    },
    [scrollNext, scrollPrev],
  );

  const onSelect = React.useCallback((emblaApi: CarouselApi) => {
    if (!emblaApi) return;

    setSelectedIndex(emblaApi.selectedScrollSnap());
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
      <div ref={emblaRef} className="overflow-hidden">
        <div
          className="flex touch-pan-y"
          style={{
            backfaceVisibility: "hidden",
          }}
        >
          {files
            // sort files images first
            .sort((a, b) => {
              const isAImage = isImageUrl(a.url);
              const isBImage = isImageUrl(b.url);
              if (isAImage && !isBImage) return -1;
              if (!isAImage && isBImage) return 1;
              return 0;
            })
            .map((f, index) => (
              <section
                className="relative aspect-square min-w-0 flex-[0_0_100%] border-muted-foreground/20"
                key={f.url} // image url is unique even if the images are the same
              >
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Previous slide"
                  className="absolute left-1.5 z-20 mr-0.5 aspect-square size-7 rounded-full text-muted-foreground opacity-90 sm:mr-2 sm:size-8"
                  disabled={prevBtnDisabled}
                  onClick={scrollPrev}
                >
                  <Icons.chevronLeft className="size-3" aria-hidden="true" />
                  <span className="sr-only">Previous slide</span>
                </Button>
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
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute right-1.5 z-20 ml-0.5 aspect-square size-7 rounded-full text-muted-foreground opacity-90 sm:ml-2 sm:size-8"
                  disabled={nextBtnDisabled}
                  onClick={scrollNext}
                >
                  <ChevronRightIcon className="size-3" aria-hidden="true" />
                  <span className="sr-only">Next slide</span>
                </Button>
              </section>
            ))}
        </div>
      </div>

      {/* {files.length > 1 ? (
        <footer className="relative z-30 flex w-full items-center justify-center gap-2 border border-muted bg-muted/50 p-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous slide"
            className="absolute left-1.5 z-20 mr-0.5 aspect-square size-7 rounded-full opacity-90 sm:mr-2 sm:size-8"
            disabled={prevBtnDisabled}
            onClick={scrollPrev}
          >
            <Icons.ChevronLeft className="size-3" aria-hidden="true" />
            <span className="sr-only">Previous slide</span>
          </Button>

          {files.map((f, i) => (
            <Button
              key={f.url}
              variant="outline"
              size="icon"
              aria-label={`Slide ${i + 1} of ${files.length}`}
              className={cn(
                "group relative aspect-square size-full max-w-[65px] rounded-none shadow-sm hover:bg-transparent focus-visible:ring-foreground",
                i === selectedIndex && "ring-1 ring-muted-foreground",
              )}
              onClick={() => scrollTo(i)}
              onKeyDown={handleKeyDown}
            >
              <div className="absolute inset-0 z-10 transition-all duration-300 group-hover:bg-zinc-950/20" />
              {isImageUrl(f.url) ? (
                <Image
                  src={f.url}
                  alt={`File ${i + 1} of ${files.length}`}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="relative flex aspect-square min-w-0 flex-[0_0_100%] flex-col items-center justify-center gap-4 border border-muted">
                  <Icons.Paperclip className="size-5 text-muted-foreground" />
                </div>
              )}
              <span className="sr-only">
                Slide {i + 1} of {files.length}
              </span>
            </Button>
          ))}

          <Button
            variant="outline"
            size="icon"
            className="absolute right-1.5 z-20 ml-0.5 aspect-square size-7 rounded-full opacity-90 sm:ml-2 sm:size-8"
            disabled={nextBtnDisabled}
            onClick={scrollNext}
          >
            <Icons.ChevronRight className="size-3" aria-hidden="true" />
            <span className="sr-only">Next slide</span>
          </Button>
        </footer>
      ) : null} */}
    </div>
  );
}
