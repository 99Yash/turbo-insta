import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "cmdk";
import { Check, ChevronsUpDown, LoaderIcon } from "lucide-react";
import * as React from "react";
import { useDebounce } from "~/hooks/use-debounce";
import { cn } from "~/lib/utils";
import { Button } from "./button";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger,
} from "./popover";

interface Props<T extends object> {
  title?: string;
  value?: T;
  valueKey: keyof T;
  disabled?: boolean;
  size?: number;
  renderText: (value: T) => string;
  onChange?: (value: T) => void;
  searchFn: (search: string, offset: number, size: number) => Promise<T[]>;
}

export const ComboBox = <T extends object>({
  title,
  value,
  valueKey,
  disabled = false,
  size = 25,
  renderText,
  onChange,
  searchFn,
}: Props<T>) => {
  const [search, setSearch] = React.useState<string>("");
  const [options, setOptions] = React.useState<T[]>([]);
  const [canLoadMore, setCanLoadMore] = React.useState<boolean>(true);
  const debouncedsearch = useDebounce<string>(search, 500);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);

  const getOptions = React.useCallback(async () => {
    setIsLoading(true);
    const searchResult = await searchFn(debouncedsearch || "", 0, size);
    if (searchResult.length === 0 || searchResult.length < size) {
      setCanLoadMore(false);
    }
    setOptions(searchResult);
    setIsLoading(false);
  }, [debouncedsearch, searchFn, size]);

  const getMoreOptions = React.useCallback(async () => {
    setIsLoading(true);
    const searchResult = await searchFn(
      debouncedsearch || "",
      options.length,
      size,
    );
    if (searchResult.length === 0 || searchResult.length < size) {
      setCanLoadMore(false);
    }
    if (
      searchResult[searchResult.length - 1]?.[valueKey] ===
      options[options.length - 1]?.[valueKey]
    ) {
      setCanLoadMore(false);
      return;
    }
    setOptions([...options, ...searchResult]);
    setIsLoading(false);
  }, [debouncedsearch, searchFn, options, valueKey, size]);

  React.useEffect(() => {
    void getOptions();
  }, [getOptions]);

  return (
    <Popover modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground",
          )}
          disabled={disabled}
        >
          <div className="truncate">
            {value ? renderText(value) : `Select ${title}`}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="PopoverContent p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={`Search ${title}...`}
            value={typeof search === "string" ? search : ""}
            onValueChange={(value) => setSearch(value)}
          />
          <CommandList>
            <CommandEmpty>No item found.</CommandEmpty>
            <CommandGroup className="max-h-60 overflow-y-auto">
              <PopoverClose asChild>
                <div>
                  {options.map((option) => (
                    <CommandItem
                      value={option[valueKey] as string}
                      key={option[valueKey] as string}
                      onSelect={() => onChange?.(option)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          option[valueKey] === value?.[valueKey]
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      {renderText(option)}
                    </CommandItem>
                  ))}
                </div>
              </PopoverClose>
              <CommandItem asChild>
                {canLoadMore && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-full"
                    onClick={getMoreOptions}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <LoaderIcon className="h-4 w-4 animate-spin" />
                    ) : (
                      "Load More ↓"
                    )}
                  </Button>
                )}
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
