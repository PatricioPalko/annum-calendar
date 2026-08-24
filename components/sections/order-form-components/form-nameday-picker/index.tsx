"use client";

import { Check } from "lucide-react";
import { useMemo, useState } from "react";
import type { UseFieldArrayAppend, UseFieldArrayRemove } from "react-hook-form";

import type { OrderFormValues } from "@/lib/schema";
import { cn } from "@/lib/utils";

type NamedaysByLetter = Record<string, string[]>;

type NamedayPickerProps = {
  data: NamedaysByLetter;
  append: UseFieldArrayAppend<OrderFormValues, "namedays">;
  remove: UseFieldArrayRemove;
  selectedNames?: string[];
};

const letterFilterButtonClassName = (isSelected: boolean) =>
  cn(
    "inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md border px-2 text-xs font-bold leading-none transition-colors outline-none",
    "focus-visible:border-[#FC5A61] focus-visible:ring-2 focus-visible:ring-[#FC5A61]/15",
    isSelected
      ? "border-[#FC5A61] bg-[#FC5A61] text-white"
      : "border-[#EAD6DE] bg-white text-[#3E0F28] hover:border-[#FC5A61]/50 hover:bg-[#FFF7F4]",
  );

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
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setLetter("all")}
          aria-pressed={letter === "all"}
          className={cn(
            letterFilterButtonClassName(letter === "all"),
            "min-w-14 px-2.5",
          )}
        >
          Všetky
        </button>

        {letters.map((item) => {
          const isSelected = letter === item;

          return (
            <button
              key={item}
              type="button"
              onClick={() => setLetter(item)}
              aria-pressed={isSelected}
              className={letterFilterButtonClassName(isSelected)}
            >
              {item}
            </button>
          );
        })}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs font-bold text-foreground sm:text-sm">
            {letter === "all"
              ? "Všetky mená"
              : `Mená · ${letter.toUpperCase()}`}
          </p>

          <span className="text-[11px] font-semibold text-[#3E0F28]/55">
            {names.length} mien
          </span>
        </div>

        <ul className="grid max-h-52 grid-cols-3 gap-1 overflow-y-auto pr-0.5 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
          {names.map((name) => {
            const isSelected = selectedNameIndex.has(name);

            return (
              <li key={name}>
                <button
                  type="button"
                  onClick={() => toggleName(name)}
                  aria-pressed={isSelected}
                  className={cn(
                    "flex w-full cursor-pointer items-center justify-between gap-1 rounded border px-2 py-1.5 text-left text-xs font-semibold transition-all duration-150 outline-none sm:text-sm",
                    "focus-visible:border-[#FC5A61] focus-visible:ring-2 focus-visible:ring-[#FC5A61]/15",
                    isSelected
                      ? "border-[#FC5A61] bg-[#FFF7F4] text-[#3E0F28]"
                      : "border-[#EAD6DE] bg-white text-[#3E0F28] hover:cursor-pointer hover:border-[#FC5A61]/50 hover:bg-[#FFF7F4]",
                  )}
                >
                  <span className="truncate">{name}</span>

                  {isSelected ? (
                    <Check className="size-3.5 shrink-0 text-[#FC5A61]" aria-hidden />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
