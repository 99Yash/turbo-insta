import * as React from "react";

export function useMediaQuery(query: string) {
  const [value, setValue] = React.useState(() => {
    // During SSR, we can't access matchMedia, so return false
    if (typeof window === "undefined") return false;
    // On client, get the actual value immediately
    return window.matchMedia(query).matches;
  });

  React.useEffect(() => {
    // Guard against SSR and environments where matchMedia is not available
    if (typeof window === "undefined" || !window.matchMedia) {
      return;
    }

    const result = window.matchMedia(query);

    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches);
    }

    // Use modern addEventListener if available, fallback to addListener for older Safari
    if (result.addEventListener) {
      result.addEventListener("change", onChange);
    } else if (result.addListener) {
      // Fallback for older Safari versions
      result.addListener(onChange);
    }

    // Ensure we have the current value
    setValue(result.matches);

    return () => {
      // Clean up using the same method we used to attach
      if (result.removeEventListener) {
        result.removeEventListener("change", onChange);
      } else if (result.removeListener) {
        // Fallback for older Safari versions
        result.removeListener(onChange);
      }
    };
  }, [query]);

  return value;
}
