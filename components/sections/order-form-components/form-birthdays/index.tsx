"use client";

import { Plus, Trash2 } from "lucide-react";
import {
  Control,
  Controller,
  UseFormTrigger,
  useFieldArray,
  useFormState,
  useWatch,
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
import { cn } from "@/lib/utils";

import {
  orderFormBirthdayControlClassName,
  orderFormBirthdaySelectClassName,
} from "../order-form-styles";

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

const birthdayDayColumnClass = "w-[52px] shrink-0";
const birthdayMonthColumnClass = "w-[110px] shrink-0";
const birthdayNameColumnClass = "w-full max-w-[7.5rem] shrink-0";
const birthdayDeleteOffsetClass = "mt-[1.5rem] sm:mt-[1.625rem]";

export function BirthdaysFieldArray({
  control,
  trigger,
}: BirthdaysFieldArrayProps) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: "birthdays",
  });

  const { errors } = useFormState({ control });
  const birthdays = useWatch({ control, name: "birthdays" });

  const canAddBirthday =
    fields.length === 0 ||
    (birthdays?.every((entry) => entry.name?.trim().length > 0) ?? false);

  async function validateBirthdayRow(index: number) {
    await trigger([
      `birthdays.${index}.day`,
      `birthdays.${index}.month`,
      `birthdays.${index}.name`,
      `birthdays.${index}`,
    ]);
  }

  async function handleAddBirthday() {
    if (fields.length > 0) {
      const lastIndex = fields.length - 1;
      const isValid = await trigger([
        `birthdays.${lastIndex}.day`,
        `birthdays.${lastIndex}.month`,
        `birthdays.${lastIndex}.name`,
        `birthdays.${lastIndex}`,
      ]);

      if (!isValid) {
        return;
      }
    }

    append({
      day: 1,
      month: 1,
      name: "",
    });
  }

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        {fields.map((item, index) => {
          const nameError = errors.birthdays?.[index]?.name;
          const showRowLabel = index === 0;

          return (
            <div
              key={item.id}
              className="grid grid-cols-[52px_110px_7.5rem_2.25rem] items-start gap-x-1.5 md:gap-x-2"
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
                        className={showRowLabel ? "" : "sr-only"}
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
                          className={`${orderFormBirthdaySelectClassName} ${birthdayDayColumnClass} gap-0 px-2! [&_svg]:size-3.5`}
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

                      {fieldState.invalid ? (
                        <FieldError id={errorId} errors={[fieldState.error]} />
                      ) : null}
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
                        className={showRowLabel ? "" : "sr-only"}
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
                          className={`${orderFormBirthdaySelectClassName} ${birthdayMonthColumnClass} gap-0 px-2! [&_svg]:size-3.5`}
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

                      {fieldState.invalid ? (
                        <FieldError id={errorId} errors={[fieldState.error]} />
                      ) : null}
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
                      className={cn("min-w-0 gap-1.5", birthdayNameColumnClass)}
                    >
                      <FieldLabel
                        htmlFor={fieldId}
                        className={showRowLabel ? "" : "sr-only"}
                      >
                        Meno
                      </FieldLabel>

                      <Input
                        {...field}
                        id={fieldId}
                        value={field.value ?? ""}
                        placeholder="Napr. Martin"
                        className={`${orderFormBirthdayControlClassName} w-full min-w-0`}
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

                      {nameError ? (
                        <FieldError
                          id={errorId}
                          errors={[nameError]}
                          className="mt-0.5"
                        />
                      ) : null}
                    </Field>
                  );
                }}
              />

              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => remove(index)}
                aria-label="Odstrániť narodeniny"
                className={`${orderFormBirthdayControlClassName} aspect-square shrink-0 px-0 ${showRowLabel ? birthdayDeleteOffsetClass : ""}`}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          );
        })}
      </div>

      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={!canAddBirthday}
        onClick={() => void handleAddBirthday()}
      >
        <Plus className="size-4" />
        Pridať narodeniny
      </Button>
    </div>
  );
}
