"use client";

import { Check } from "lucide-react";
import { useMemo, useState } from "react";
import type { UseFieldArrayAppend, UseFieldArrayRemove } from "react-hook-form";

import { Button } from "@/components/ui/button";
import type { OrderFormValues } from "@/lib/schema";
import { cn } from "@/lib/utils";

type NamedaysByLetter = Record<string, string[]>;

type NamedayPickerProps = {
  data: NamedaysByLetter;
  append: UseFieldArrayAppend<OrderFormValues, "namedays">;
  remove: UseFieldArrayRemove;
  selectedNames?: string[];
};

export function NamedayPicker({
  data,
  append,
  remove,
  selectedNames = [],
}: NamedayPickerProps) {
  const letters = useMemo(
    () => Object.keys(data).sort((a, b) => a.localeCompare(b, "sk")),
    [data],
  );

  const [letter, setLetter] = useState<string | "all">(letters[0] ?? "all");

  const selectedNameIndex = useMemo(() => {
    const map = new Map<string, number>();

    selectedNames.forEach((name, index) => {
      map.set(name, index);
    });

    return map;
  }, [selectedNames]);

  const names = useMemo(() => {
    const result =
      letter === "all"
        ? letters.flatMap((key) => data[key] ?? [])
        : (data[letter] ?? []);

    return Array.from(new Set(result)).sort((a, b) => a.localeCompare(b, "sk"));
  }, [data, letter, letters]);

  const toggleName = (name: string) => {
    const existingIndex = selectedNameIndex.get(name);

    if (existingIndex !== undefined) {
      remove(existingIndex);
      return;
    }

    append({ name });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        <Button
          type="button"
          onClick={() => setLetter("all")}
          aria-pressed={letter === "all"}
          variant={letter === "all" ? "default" : "secondary"}
          size="sm"
          className="h-8 px-2 text-xs sm:h-10 sm:px-3 sm:text-sm"
        >
          Všetky
        </Button>

        {letters.map((item) => {
          const isSelected = letter === item;

          return (
            <Button
              key={item}
              type="button"
              variant={isSelected ? "default" : "secondary"}
              size="sm"
              onClick={() => setLetter(item)}
              aria-pressed={isSelected}
              className="h-8 min-w-8 px-1.5 text-xs sm:h-10 sm:min-w-10 sm:px-3 sm:text-sm"
            >
              {item}
            </Button>
          );
        })}
      </div>

      <div className="">
        <div className="mb-4 flex items-center justify-between gap-4">
          <p className="text-sm font-bold text-foreground">
            {letter === "all"
              ? "Všetky mená"
              : `Mená na písmeno ${letter.toUpperCase()}`}
          </p>

          <span className="text-xs font-semibold text-foreground">
            {names.length} mien
          </span>
        </div>

        <ul className="grid max-h-67 grid-cols-3 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-4 sm:gap-2 lg:grid-cols-6">
          {names.map((name) => {
            const isSelected = selectedNameIndex.has(name);

            return (
              <li key={name}>
                <button
                  type="button"
                  onClick={() => toggleName(name)}
                  aria-pressed={isSelected}
                  className={cn(
                    [
                      "flex w-full items-center justify-between gap-1.5 rounded-md border px-2 py-1.5",
                      "text-left text-xs font-semibold transition-all duration-200",
                      "sm:gap-2 sm:px-3 sm:py-2 sm:text-sm",
                      "outline-none",
                      "focus-visible:border-[#FC5A61] focus-visible:ring-4 focus-visible:ring-[#FC5A61]/15",
                      "hover:cursor-pointer",
                      isSelected
                        ? "border-[#FC5A61] bg-[#FFF7F4] text-[#3E0F28] shadow-sm"
                        : "border-[#EAD6DE] bg-white text-[#3E0F28] hover:border-[#FC5A61]/50 hover:bg-[#FFF7F4] hover:shadow-sm",
                    ].join(" "),
                  )}
                >
                  <span className="truncate">{name}</span>

                  {isSelected && (
                    <Check className="size-4.5 shrink-0 text-[#FC5A61]" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
