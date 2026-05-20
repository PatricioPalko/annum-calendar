"use client";
import { calendarTypes, CUSTOM_QUANTITY_VALUE } from "@/app/types/types";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import { Heading, Text } from "@/components/ui/typography";
import { getFinalQuantity } from "@/helpers/form";
import { OrderFormValues, orderSchema } from "@/lib/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { BirthdaysFieldArray } from "../order-form-components/form-birthdays";
import { FormInput } from "../order-form-components/form-input";
import { NamedaysFieldArray } from "../order-form-components/form-namedays";
import { PhotoDropzone } from "../order-form-components/form-photo-dropzone";
import { PriceSummary } from "../order-form-components/form-price-summary";
import { FormQuantity } from "../order-form-components/form-quantity";
import { FormRadioGroup } from "../order-form-components/form-radiogroup";
import { FormTextarea } from "../order-form-components/form-textarea";
import OrderSection from "../order-section";

export default function OrderForm() {
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      note: "",
      types: "premium",
      quantityOption: 3,
      customQuantity: undefined,
      photos: [],
      birthdays: [],
      namedays: [],
    },
  });

  function onSubmit(values: OrderFormValues) {
    const quantity = getFinalQuantity(values);

    const payload = {
      id: crypto.randomUUID(),
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      phone: values.phone,
      note: values.note,
      type: values.types,
      photos: values.photos,
      birthdays: values.birthdays,
      namedays: values.namedays,
      quantity,
    };

    console.log(payload);
  }

  const selectedQuantityOption = form.watch("quantityOption");
  const selectedCalendarType = form.watch("types");
  const customQuantity = form.watch("customQuantity");
  const selectedPhotosQuantity = form.watch("photos")?.length ?? 0;

  useEffect(() => {
    if (selectedCalendarType === "business") {
      form.setValue("quantityOption", CUSTOM_QUANTITY_VALUE, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [selectedCalendarType, form]);

  return (
    <div className="mx-auto mt-8 max-w-7xl rounded-xl border border-[#EAD6DE] bg-white px-4 py-10 text-primary shadow-2xl shadow-[#3E0F28]/10 md:px-6">
      <div className="my-8 text-center">
        <Text variant="caption" as="span">
          Konfigurátor
        </Text>

        <Heading as="h2" className="mt-2">
          Nástenný A3 kalendár
        </Heading>

        <Text>
          Vyberte variant, počet kusov, nahrajte fotky a doplňte dôležité
          dátumy.
        </Text>
      </div>

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        id="order-form"
        className="grid gap-4 lg:grid-cols-[1fr_360px] mt-20"
      >
        <div className="space-y-8">
          <OrderSection
            step="1"
            title="Typ kalendára"
            description="Vyberte, či chcete jednoduchý fotokalendár alebo kalendár aj s meninami a narodeninami."
          >
            <FormRadioGroup
              control={form.control}
              name="types"
              label="Typ kalendára"
              options={calendarTypes}
            />
          </OrderSection>

          <OrderSection
            step="2"
            title="Počet kusov"
            description="Pri viacerých rovnakých kusoch sa automaticky použije výhodnejšia cena za kus."
          >
            <FormQuantity
              control={form.control}
              name="quantityOption"
              label="Počet kusov"
              selectedCalendarType={selectedCalendarType}
            />
          </OrderSection>

          <OrderSection
            step="3"
            title="Fotky"
            description="Nahrajte minimálne 14 fotiek. Ideálne vyberte viac záberov, aby bolo z čoho skladať jednotlivé mesiace."
          >
            <Controller
              name="photos"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  {/* <FieldLabel>Fotky do kalendára</FieldLabel> */}

                  <FieldDescription>
                    JPG, PNG alebo WEBP · minimálne 14 fotiek · maximálne 50
                    fotiek · max. 10 MB / fotka
                  </FieldDescription>

                  <PhotoDropzone
                    value={field.value ?? []}
                    onChange={field.onChange}
                  />

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </OrderSection>

          {selectedCalendarType === "premium" && (
            <>
              <OrderSection
                step="4"
                title="Dôležité narodeniny"
                description="Doplňte narodeniny a meniny, ktoré chcete mať v kalendári zvýraznené."
              >
                <div className="space-y-8">
                  <BirthdaysFieldArray control={form.control} />
                </div>
              </OrderSection>
              <OrderSection
                step="5"
                title="Dôležité meniny"
                description="Doplňte narodeniny a meniny, ktoré chcete mať v kalendári zvýraznené."
              >
                <div className="space-y-8">
                  <NamedaysFieldArray control={form.control} />
                </div>
              </OrderSection>
            </>
          )}
          <OrderSection
            step={selectedCalendarType === "premium" ? "6" : "4"}
            title="Kontaktné údaje"
            description="Tieto údaje použijeme len na spracovanie objednávky."
          >
            <FieldGroup className="grid gap-4 md:grid-cols-2">
              <FormInput
                control={form.control}
                name="firstName"
                label="Meno"
                type="text"
                placeholder="Ján"
              />
              <FormInput
                control={form.control}
                name="lastName"
                label="Priezvisko"
                type="text"
                placeholder="Novák"
              />
              <FormInput
                control={form.control}
                name="email"
                label="E-mail"
                autoComplete="email"
                type="email"
                placeholder="jan.novak@gmail.com"
              />
              <FormInput
                control={form.control}
                name="phone"
                label="Telefónne číslo"
                autoComplete="phone"
                type="tel"
                placeholder="+421 9xx xxx xxx"
              />
            </FieldGroup>
          </OrderSection>
          <OrderSection
            step={selectedCalendarType === "premium" ? "7" : "5"}
            title="Poznámka"
            description="Poznámka k objednávke"
          >
            <FormTextarea control={form.control} name="note" label="Poznámka" />
          </OrderSection>
        </div>

        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="space-y-4">
            <PriceSummary
              type={selectedCalendarType}
              quantityOption={selectedQuantityOption}
              customQuantity={customQuantity}
              selectedPhotosQuantity={selectedPhotosQuantity}
              onQuantityChange={(quantity) => {
                form.setValue("quantityOption", quantity, {
                  shouldValidate: true,
                  shouldDirty: true,
                  shouldTouch: true,
                });

                form.setValue("customQuantity", undefined, {
                  shouldValidate: true,
                  shouldDirty: true,
                  shouldTouch: true,
                });
              }}
            />

            <Button
              type="submit"
              form="order-form"
              size="lg"
              className="w-full"
            >
              Odoslať objednávku
            </Button>

            <p className="text-center text-xs leading-5 text-muted-foreground">
              Po odoslaní objednávky vám potvrdím cenu a ďalší postup.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}
