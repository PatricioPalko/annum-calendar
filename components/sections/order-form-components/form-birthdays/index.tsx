"use client";

import { Plus, Trash2 } from "lucide-react";
import { Control, Controller, useFieldArray } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { OrderFormInput } from "@/lib/schema";

const days = Array.from({ length: 31 }, (_, index) => index + 1);

const months = [
  { value: 1, label: "Január" },
  { value: 2, label: "Február" },
  { value: 3, label: "Marec" },
  { value: 4, label: "Apríl" },
  { value: 5, label: "Máj" },
  { value: 6, label: "Jún" },
  { value: 7, label: "Júl" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "Október" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

type BirthdaysFieldArrayProps = {
  control: Control<OrderFormInput>;
};

export function BirthdaysFieldArray({ control }: BirthdaysFieldArrayProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "birthdays",
  });

  return (
    <div className="space-y-4">
      {/* <div>
        <h3 className="text-lg font-medium">Narodeniny</h3>
        <p className="mt-1 text-left tracking-wide leading-normal font-normal text-muted-foreground">
          Pridajte dátumy narodenín, ktoré chcete označiť v kalendári.
        </p>
      </div> */}

      <div className="space-y-2">
        {fields.map((item, index) => (
          <div
            key={item.id}
            className="grid gap-2 py-1 md:grid-cols-[120px_160px_1fr_auto]"
          >
            <Controller
              name={`birthdays.${index}.day`}
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className={index === 0 ? "" : "sr-only"}>
                    Deň
                  </FieldLabel>
                  <Select
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <SelectTrigger aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Deň" />
                    </SelectTrigger>
                    <SelectContent>
                      {days.map((day) => (
                        <SelectItem key={day} value={String(day)}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name={`birthdays.${index}.month`}
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className={index === 0 ? "" : "sr-only"}>
                    Mesiac
                  </FieldLabel>
                  <Select
                    value={field.value ? String(field.value) : ""}
                    onValueChange={(value) => field.onChange(Number(value))}
                  >
                    <SelectTrigger aria-invalid={fieldState.invalid}>
                      <SelectValue placeholder="Mesiac" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem
                          key={month.value}
                          value={String(month.value)}
                        >
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name={`birthdays.${index}.name`}
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel className={index === 0 ? "" : "sr-only"}>
                    Meno
                  </FieldLabel>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Napr. Martin"
                    aria-invalid={fieldState.invalid}
                  />

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <div className="flex items-end">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => remove(index)}
                aria-label="Odstrániť narodeniny"
                className="size-8"
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="secondary"
        onClick={() =>
          append({
            day: 1,
            month: 1,
            name: "",
          })
        }
      >
        <Plus className="size-4" />
        Pridať narodeniny
      </Button>
    </div>
  );
}
