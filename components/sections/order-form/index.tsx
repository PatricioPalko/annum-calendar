"use client";
import { calendarTypes, CUSTOM_QUANTITY_VALUE } from "@/app/types/types";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Heading } from "@/components/ui/typography";
import { getFinalQuantity } from "@/helpers/form";
import { OrderFormValues, orderSchema } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { FormInput } from "./form-input";
import { FormNumberInput } from "./form-number-input";
import { FormQuantity } from "./form-quantity";
import { FormRadioGroup } from "./form-radiogroup";

export default function OrderForm() {
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      types: "basic",
      quantityOption: 1,
      customQuantity: undefined,
    },
  });

  function onSubmit(values: OrderFormValues) {
    const quantity = getFinalQuantity(values);

    const payload = {
      firstName: values.firstName,
      lastName: values.lastName,
      type: values.types,
      quantity,
    };

    console.log(payload);
  }

  const selectedQuantityOption = form.watch("quantityOption");
  const selectedCalendarType = form.watch("types");

  useEffect(() => {
    if (selectedCalendarType === "business") {
      form.setValue("quantityOption", CUSTOM_QUANTITY_VALUE, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [selectedCalendarType, form]);

  return (
    <div className="mx-auto mt-8 max-w-6xl overflow-hidden rounded-4xl bg-white px-2 py-12 text-primary shadow-2xl shadow-[#3E0F28]/20 border-[#EAD6DE] border-2">
      <div className="mb-12 text-center">
        <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-secondary">
          Konfigurátor
        </p>
        <Heading as="h2" className="mt-2">
          Nástenný A3 kalendár
        </Heading>
      </div>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-8 p-6"
        id="order-form"
      >
        <FieldGroup className="grid md:grid-cols-2 gap-4">
          <FormInput control={form.control} name="firstName" label="Meno" />
          <FormInput
            control={form.control}
            name="lastName"
            label="Priezvisko"
          />
        </FieldGroup>
        <FieldGroup>
          <FormRadioGroup
            control={form.control}
            name="types"
            label="Typ"
            options={calendarTypes}
          />
        </FieldGroup>
        <FieldGroup>
          <FormQuantity
            control={form.control}
            name="quantityOption"
            label="Počet kusov"
            selectedCalendarType={selectedCalendarType}
          />

          {selectedQuantityOption === CUSTOM_QUANTITY_VALUE && (
            <FormNumberInput
              control={form.control}
              isBusinessType={selectedCalendarType === "business"}
            />
          )}
        </FieldGroup>
        <Button type="submit" form="order-form">
          Objednaj
        </Button>
      </form>
    </div>
  );
}
