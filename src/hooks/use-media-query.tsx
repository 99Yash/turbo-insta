import * as React from "react";

export function useMediaQuery(query: string) {
  const [value, setValue] = React.useState(() => {
    // During SSR, we can't access matchMedia, so return false
    if (typeof window === "undefined") return false;
    // On client, get the actual value immediately
    return window.matchMedia(query).matches;
  });

  React.useEffect(() => {
    const result = matchMedia(query);

    function onChange(event: MediaQueryListEvent) {
      setValue(event.matches);
    }

    result.addEventListener("change", onChange);
    // Ensure we have the current value
    setValue(result.matches);

    return () => result.removeEventListener("change", onChange);
  }, [query]);

  return value;
}
