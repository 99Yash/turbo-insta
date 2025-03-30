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
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { TextGenerateEffect } from "./text-generate";

type CarouselApi = UseEmblaCarouselType["1"];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters["0"];

interface PostCarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  files: StoredFile[] | null;
  options?: CarouselOptions;
  modal?: boolean;
}

export function PostCarousel({
  files,
  className,
  options,
  modal = false,
  ...props
}: PostCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(options);
  const [selectedIndex, setSelectedIndex] = React.useState(0);

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
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, []);

  React.useEffect(() => {
    if (!emblaApi) return;

    onSelect(emblaApi);
    emblaApi.on("reInit", onSelect);
    emblaApi.on("select", onSelect);
  }, [emblaApi, onSelect]);

  const scrollTo = React.useCallback(
    (index: number) => emblaApi && emblaApi.scrollTo(index),
    [emblaApi],
  );

  if (!files || files.length === 0) {
    return null;
  }

  return (
    <div
      aria-label="Product image carousel"
      className={cn("relative flex max-w-full flex-col gap-4", className)}
      {...props}
    >
      <Button
        variant="ghost"
        size="icon"
        aria-label="Previous slide"
        className={cn(
          "absolute left-1.5 top-1/2 z-20 mr-0.5 aspect-square size-6 rounded-full bg-muted text-foreground opacity-90",
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
              className="relative min-w-0 flex-[0_0_100%] rounded border border-muted-foreground/20"
              key={f.url}
            >
              <div
                className={cn(
                  "relative w-full",
                  modal
                    ? "flex h-[calc(100vh-4rem)] items-center justify-center"
                    : "aspect-square",
                )}
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
              </div>
            </section>
          ))}
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "absolute right-1.5 top-1/2 z-20 mr-0.5 aspect-square size-6 rounded-full bg-muted text-foreground opacity-90",
          nextBtnDisabled && "hidden",
        )}
        onClick={scrollNext}
      >
        <ChevronRightIcon className="size-3" aria-hidden="true" />
        <span className="sr-only">Next slide</span>
      </Button>

      <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
        {files.length > 1 &&
          files.map((_, index) => (
            <Button
              key={index}
              variant="ghost"
              size="icon"
              className={cn(
                "size-1.5 rounded-full p-0",
                selectedIndex === index
                  ? "bg-foreground"
                  : "bg-foreground/50 hover:bg-foreground/70",
              )}
              onClick={() => scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
      </div>

      {files[selectedIndex]?.alt && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="absolute bottom-4 right-4 z-20 h-6 rounded-md bg-background/80 px-2 text-xs font-semibold backdrop-blur-md hover:bg-background/90"
            >
              ALT
            </Button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="end"
            className="w-64 text-xs italic opacity-90 backdrop-blur-xl"
          >
            <TextGenerateEffect text={files[selectedIndex].alt} />
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
