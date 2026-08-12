"use client";

import { Plus, Trash2 } from "lucide-react";
import {
  Control,
  Controller,
  UseFormTrigger,
  useFieldArray,
} from "react-hook-form";

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
  trigger: UseFormTrigger<OrderFormInput>;
};

const birthdayControlClass =
  "h-8! min-h-8 py-0! sm:h-9! sm:min-h-9 md:h-11! md:min-h-11";
const birthdayDayColumnClass = "w-[45px] shrink-0";
const birthdayMonthColumnClass = "w-[100px] shrink-0";

export function BirthdaysFieldArray({
  control,
  trigger,
}: BirthdaysFieldArrayProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "birthdays",
  });

  async function validateBirthdayRow(index: number) {
    await trigger([
      `birthdays.${index}.day`,
      `birthdays.${index}.month`,
      `birthdays.${index}.name`,
      `birthdays.${index}`,
    ]);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {fields.map((item, index) => (
          <div
            key={item.id}
            className="grid grid-cols-[45px_100px_minmax(0,1fr)] items-end gap-1 py-1 md:gap-2"
          >
            <Controller
              name={`birthdays.${index}.day`}
              control={control}
              render={({ field, fieldState }) => {
                const fieldId = `birthday-${index}-day`;
                const errorId = `${fieldId}-error`;

                return (
                  <Field
                    data-invalid={fieldState.invalid}
                    className={birthdayDayColumnClass}
                  >
                    <FieldLabel
                      htmlFor={fieldId}
                      className={index === 0 ? "" : "sr-only"}
                    >
                      Deň
                    </FieldLabel>
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={async (value) => {
                        field.onChange(Number(value));
                        await validateBirthdayRow(index);
                      }}
                    >
                      <SelectTrigger
                        id={fieldId}
                        className={`${birthdayControlClass} ${birthdayDayColumnClass} gap-0 px-1! [&_svg]:size-3 md:px-1.5! md:[&_svg]:size-4`}
                        aria-invalid={fieldState.invalid}
                        aria-describedby={
                          fieldState.invalid ? errorId : undefined
                        }
                      >
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
                      <FieldError id={errorId} errors={[fieldState.error]} />
                    )}
                  </Field>
                );
              }}
            />

            <Controller
              name={`birthdays.${index}.month`}
              control={control}
              render={({ field, fieldState }) => {
                const fieldId = `birthday-${index}-month`;
                const errorId = `${fieldId}-error`;

                return (
                  <Field
                    data-invalid={fieldState.invalid}
                    className={birthdayMonthColumnClass}
                  >
                    <FieldLabel
                      htmlFor={fieldId}
                      className={index === 0 ? "" : "sr-only"}
                    >
                      Mesiac
                    </FieldLabel>
                    <Select
                      value={field.value ? String(field.value) : ""}
                      onValueChange={async (value) => {
                        field.onChange(Number(value));
                        await validateBirthdayRow(index);
                      }}
                    >
                      <SelectTrigger
                        id={fieldId}
                        className={`${birthdayControlClass} ${birthdayMonthColumnClass} gap-0 px-1! md:px-2! [&_svg]:size-3 md:[&_svg]:size-4`}
                        aria-invalid={fieldState.invalid}
                        aria-describedby={
                          fieldState.invalid ? errorId : undefined
                        }
                      >
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
                      <FieldError id={errorId} errors={[fieldState.error]} />
                    )}
                  </Field>
                );
              }}
            />

            <Controller
              name={`birthdays.${index}.name`}
              control={control}
              render={({ field, fieldState }) => {
                const fieldId = `birthday-${index}-name`;
                const errorId = `${fieldId}-error`;

                return (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="min-w-0 gap-1.5"
                  >
                    <FieldLabel
                      htmlFor={fieldId}
                      className={index === 0 ? "" : "sr-only"}
                    >
                      Meno
                    </FieldLabel>

                    <div className="flex min-w-0 items-stretch gap-2">
                      <Input
                        {...field}
                        id={fieldId}
                        value={field.value ?? ""}
                        placeholder="Napr. Martin"
                        className={`${birthdayControlClass} min-w-0 flex-1 px-2.5 sm:px-4`}
                        aria-invalid={fieldState.invalid}
                        aria-describedby={
                          fieldState.invalid ? errorId : undefined
                        }
                        onChange={(event) => {
                          field.onChange(event.target.value);
                          void trigger(`birthdays.${index}.name`);
                        }}
                        onBlur={() => {
                          field.onBlur();
                          void trigger(`birthdays.${index}.name`);
                        }}
                      />

                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        onClick={() => remove(index)}
                      aria-label="Odstrániť narodeniny"
                        className={`${birthdayControlClass} aspect-square shrink-0 px-0`}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>

                    {fieldState.invalid && (
                      <FieldError id={errorId} errors={[fieldState.error]} />
                    )}
                  </Field>
                );
              }}
            />
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
