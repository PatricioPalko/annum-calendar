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
    <div className="space-y-5">
      {/* <div>
        <h3 className="text-lg font-medium">Meniny</h3>

        <p className="mt-1 text-left text-sm leading-normal tracking-wide text-muted-foreground">
          Vyberte mená, ktorých meniny chcete v kalendári zvýrazniť.
        </p>
      </div> */}

      <NamedayPicker
        data={data}
        append={append}
        remove={remove}
        selectedNames={selectedNames}
      />
      {sortedSelectedNames.length > 0 && (
        <div className="rounded-md border border-border bg-surface p-4">
          <div className="mb-3 flex items-center justify-between gap-4">
            <p className="text-sm font-bold text-foreground">Vybrané meniny</p>

            <span className="text-xs font-semibold text-foreground">
              {sortedSelectedNames.length} mien
            </span>
          </div>

          <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {sortedSelectedNames.map((name) => (
              <li key={name} className="text-sm font-medium text-foreground">
                {name}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
