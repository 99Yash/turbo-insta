"use client";

import { ChevronRightIcon } from "@radix-ui/react-icons";
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react";
import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";
import Image from "next/image";
import * as React from "react";
import { cn, showErrorToast } from "~/lib/utils";
import { api } from "~/trpc/react";
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
  optimize?: boolean;
  postId?: string;
}

export function PostCarousel({
  files,
  className,
  options,
  modal = false,
  optimize = true,
  postId,
  ...props
}: PostCarouselProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel(options);
  const [selectedIndex, setSelectedIndex] = React.useState(0);
  const [loadingStates, setLoadingStates] = React.useState<
    Record<string, boolean>
  >({});
  const [errorStates, setErrorStates] = React.useState<Record<string, boolean>>(
    {},
  );
  const [containerHeight, setContainerHeight] = React.useState<number>(0);
  const imageRefs = React.useRef<Record<string, HTMLImageElement>>({});
  const [showHeartAnimation, setShowHeartAnimation] = React.useState(false);

  const [prevBtnDisabled, setPrevBtnDisabled] = React.useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = React.useState(true);

  // Like functionality for double-click (enabled when postId is provided and not in modal)
  const enableDoubleClickLike = !!postId && !modal;
  const utils = api.useUtils();
  const { data: likesData } = api.posts.getLikes.useQuery(
    { postId: postId! },
    {
      enabled: enableDoubleClickLike,
      refetchOnWindowFocus: false,
    },
  );

  const toggleLike = api.likes.toggle.useMutation({
    async onSuccess() {
      await utils.posts.getLikes.invalidate({ postId });
    },
    onError(error) {
      showErrorToast(error);
    },
  });

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

  React.useEffect(() => {
    if (files) {
      const initialLoadingStates: Record<string, boolean> = {};
      files.forEach((file) => {
        initialLoadingStates[file.id] = true;
      });
      setLoadingStates(initialLoadingStates);
    }
  }, [files]);

  const handleImageLoad = React.useCallback(
    (fileId: string, img: HTMLImageElement) => {
      imageRefs.current[fileId] = img;

      // Calculate the maximum height among all loaded images
      const heights = Object.values(imageRefs.current).map(
        (image) => image.offsetHeight,
      );
      const maxHeight = Math.max(...heights);

      if (maxHeight > containerHeight) {
        setContainerHeight(maxHeight);
      }
    },
    [containerHeight],
  );

  const handleDoubleClick = React.useCallback(async () => {
    if (enableDoubleClickLike && postId) {
      try {
        const wasLiked = likesData?.hasLiked ?? false;
        await toggleLike.mutateAsync({
          postId,
          type: "post" as const,
        });

        // Only show animation if we're going from unliked to liked
        if (!wasLiked) {
          setShowHeartAnimation(true);
          // Hide the animation after it completes
          setTimeout(() => {
            setShowHeartAnimation(false);
          }, 1000);
        }
      } catch (error) {
        console.error("Error handling double click:", error);
      }
    }
  }, [enableDoubleClickLike, postId, toggleLike, likesData?.hasLiked]);

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
      <div
        ref={emblaRef}
        className="overflow-hidden"
        onDoubleClick={handleDoubleClick}
      >
        <div
          className="flex touch-pan-y"
          style={{
            backfaceVisibility: "hidden",
          }}
        >
          {files.map((f, index) => (
            <section
              className="relative min-w-0 flex-[0_0_100%] rounded"
              key={f.url}
            >
              <div
                className={cn(
                  "relative w-full",
                  modal
                    ? "flex h-[calc(100vh-4rem)] items-center justify-center"
                    : optimize
                      ? "flex items-center justify-center"
                      : "aspect-square",
                )}
                style={
                  optimize && containerHeight > 0
                    ? { height: containerHeight }
                    : undefined
                }
              >
                {optimize ? (
                  <Image
                    aria-label={`Slide ${index + 1} of ${files.length}`}
                    role="group"
                    key={f.id}
                    aria-roledescription="slide"
                    src={f.url}
                    alt={f.alt ?? `Post image ${index + 1} of ${files.length}`}
                    width={1080}
                    height={720}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="max-h-[55vh] w-full object-cover"
                    priority={index === 0}
                    onLoad={(e) => {
                      const img = e.currentTarget;
                      handleImageLoad(f.id, img);
                    }}
                  />
                ) : (
                  <>
                    {/* Loading placeholder */}
                    {loadingStates[f.id] && (
                      <div className="absolute inset-0 flex animate-pulse flex-col items-center justify-center bg-muted">
                        <Icons.placeholder className="size-8 animate-pulse text-muted-foreground" />
                      </div>
                    )}
                    {/* Error placeholder */}
                    {errorStates[f.id] && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Icons.placeholder className="size-12 text-red-500" />
                      </div>
                    )}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      aria-label={`Slide ${index + 1} of ${files.length}`}
                      role="group"
                      key={f.id}
                      loading={index === 0 ? "eager" : "lazy"}
                      aria-roledescription="slide"
                      src={f.url}
                      onLoadStart={() => {
                        setLoadingStates((prev) => ({ ...prev, [f.id]: true }));
                        setErrorStates((prev) => ({ ...prev, [f.id]: false }));
                      }}
                      onLoad={(e) => {
                        setLoadingStates((prev) => ({
                          ...prev,
                          [f.id]: false,
                        }));
                        const img = e.currentTarget;
                        handleImageLoad(f.id, img);
                      }}
                      onError={() => {
                        setLoadingStates((prev) => ({
                          ...prev,
                          [f.id]: false,
                        }));
                        setErrorStates((prev) => ({ ...prev, [f.id]: true }));
                      }}
                      alt={
                        f.alt ?? `Post image ${index + 1} of ${files.length}`
                      }
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className={cn(
                        "object-cover xl:h-full xl:w-full",
                        (loadingStates[f.id] ??
                          (false || errorStates[f.id]) ??
                          false) &&
                          "opacity-0",
                      )}
                    />
                  </>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Heart Animation Overlay */}
      <AnimatePresence>
        {showHeartAnimation && (
          <motion.div
            className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0.5, 1.2, 1, 1.3],
            }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{
              duration: 1,
              ease: "easeOut",
              times: [0, 0.2, 0.8, 1],
            }}
          >
            <Heart className="size-16 fill-rose-500 text-rose-500 drop-shadow-lg" />
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "absolute right-1.5 top-1/2 z-20 mr-0.5 aspect-square size-6 rounded-full bg-muted text-foreground",
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
              ✨ ALT
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
