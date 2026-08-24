"use client";

import { Control, useFieldArray, useWatch } from "react-hook-form";

import type { OrderFormValues } from "@/lib/schema";
import data from "@/names.json";
import { NamedayPicker } from "../form-nameday-picker";

type NamedaysFieldArrayProps = {
  control: Control<OrderFormValues>;
};

export function NamedaysFieldArray({ control }: NamedaysFieldArrayProps) {
  const { append, remove } = useFieldArray({
    control,
    name: "namedays",
  });

  const namedays = useWatch({
    control,
    name: "namedays",
  });

  const selectedNames =
    namedays?.map((item) => item.name).filter(Boolean) ?? [];

  const sortedSelectedNames = [...selectedNames].sort((a, b) =>
    a.localeCompare(b, "sk"),
  );

  return (
    <div className="space-y-3">
      <NamedayPicker
        data={data}
        append={append}
        remove={remove}
        selectedNames={selectedNames}
      />
      {sortedSelectedNames.length > 0 && (
        <div className="rounded-md border border-[#EAD6DE] bg-[#FFF7F4]/80 p-2.5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-xs font-bold text-foreground">Vybrané meniny</p>

            <span className="text-[11px] font-semibold text-[#3E0F28]/55">
              {sortedSelectedNames.length}
            </span>
          </div>

          <ul className="flex flex-wrap gap-1.5">
            {sortedSelectedNames.map((name) => (
              <li
                key={name}
                className="rounded-full border border-[#EAD6DE] bg-white px-2 py-0.5 text-[11px] font-semibold text-foreground sm:text-xs"
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
