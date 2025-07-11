import * as React from "react";

/**
 * Use a ResizeObserver to react to changes in an element's size
 * More about ResizeObserver: https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver
 */
export function useResizeObserver(
  elementRef: React.RefObject<Element>,
): ResizeObserverEntry | undefined {
  const [entry, setEntry] = React.useState<ResizeObserverEntry>();

  const updateEntry = ([entry]: ResizeObserverEntry[]): void => {
    setEntry(entry);
  };

  React.useEffect(() => {
    const node = elementRef?.current;
    if (!node) return;

    const observer = new ResizeObserver(updateEntry);

    observer.observe(node);

    return () => observer.disconnect();
  }, [elementRef]);

  return entry;
}
