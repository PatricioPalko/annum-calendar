"use client";
import { calendarTypes, CUSTOM_QUANTITY_VALUE } from "@/app/types/types";
import { TurnstileWidget } from "@/components/security/turnstile-widget";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import { Heading, Text } from "@/components/ui/typography";
import { getDiscountCode } from "@/helpers/discount-codes";
import { getFinalQuantity } from "@/helpers/form";
import { OrderFormValues, orderSchema } from "@/lib/schema";
import { uploadOrderPhotos } from "@/lib/upload-order-photos";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { BirthdaysFieldArray } from "../order-form-components/form-birthdays";
import { FormConsentCheckbox } from "../order-form-components/form-consent-checkbox";
import { FormInput } from "../order-form-components/form-input";
import { NamedaysFieldArray } from "../order-form-components/form-namedays";
import { PhotoDropzone } from "../order-form-components/form-photo-dropzone";
import { PriceSummary } from "../order-form-components/form-price-summary";
import { FormQuantity } from "../order-form-components/form-quantity";
import { FormRadioGroup } from "../order-form-components/form-radiogroup";
import { FormTextarea } from "../order-form-components/form-textarea";
import { OrderSuccessDialog } from "../order-form-components/order-success-dialog";
import OrderSection from "../order-section";

const orderFormDefaultValues: OrderFormValues = {
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
  termsAccepted: false,
  discountCode: "",
};

export default function OrderForm() {
  const [createdOrder, setCreatedOrder] = useState<{
    orderCode: string;
  } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: orderFormDefaultValues,
  });

  function scrollToFirstError(errors: unknown) {
    requestAnimationFrame(() => {
      const firstInvalidElement = document.querySelector(
        "[data-error-section='true']",
      );

      firstInvalidElement?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });
  }

  async function onSubmit(values: OrderFormValues) {
    try {
      console.log("SUBMIT_START", values);

      setSubmitError(null);

      const quantity = getFinalQuantity(values);
      console.log("QUANTITY_OK", quantity);

      const uploaded = await uploadOrderPhotos({
        firstName: values.firstName,
        lastName: values.lastName,
        files: values.photos,
        turnstileToken,
      });

      console.log("UPLOAD_OK", uploaded);

      const payload = {
        orderNumber: uploaded.orderNumber,
        orderCode: uploaded.orderCode,
        storageFolder: uploaded.storageFolder,
        finalizeToken: uploaded.finalizeToken,

        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone,
        note: values.note,

        type: values.types,
        quantity,

        photos: uploaded.photos,
        birthdays: values.birthdays,
        namedays: values.namedays,

        termsAccepted: values.termsAccepted,
        discountCode: values.discountCode?.trim() || undefined,
      };

      console.log("CREATE_ORDER_PAYLOAD", payload);

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      console.log("CREATE_ORDER_STATUS", response.status);

      if (!response.ok) {
        const errorText = await response.text();

        console.error("CREATE_ORDER_RESPONSE_ERROR:", {
          status: response.status,
          errorText,
        });

        throw new Error("Objednávku sa nepodarilo odoslať.");
      }

      const result = await response.json();

      console.log("CREATE_ORDER_OK", result);

      setCreatedOrder({
        orderCode: result.orderCode,
      });

      form.reset(orderFormDefaultValues);
    } catch (error) {
      console.error("ORDER_SUBMIT_ERROR:", error);

      setSubmitError(
        "Objednávku sa nepodarilo odoslať. Skúste to prosím znova alebo nás kontaktujte.",
      );
    }
  }

  const selectedQuantityOption = form.watch("quantityOption");
  const selectedCalendarType = form.watch("types");
  const customQuantity = form.watch("customQuantity");
  const selectedPhotosQuantity = form.watch("photos")?.length ?? 0;
  const isSubmitting = form.formState.isSubmitting;

  const [discountCodeTouched, setDiscountCodeTouched] = useState(false);

  const discountCode = form.watch("discountCode") ?? "";
  const normalizedDiscountCode = discountCode.trim().toUpperCase();

  const discountCodeError =
    normalizedDiscountCode && !getDiscountCode(normalizedDiscountCode)
      ? "Zľavový kód nie je platný."
      : undefined;

  useEffect(() => {
    if (selectedCalendarType === "business") {
      form.setValue("quantityOption", CUSTOM_QUANTITY_VALUE, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  }, [selectedCalendarType, form]);

  const errors = form.formState.errors;

  const hasPhotoError = Boolean(errors.photos);
  const hasTermsError = Boolean(errors.termsAccepted);
  const hasTurnstileError = !turnstileToken && form.formState.isSubmitted;

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
        onSubmit={form.handleSubmit(onSubmit, scrollToFirstError)}
        id="order-form"
        className="grid gap-4 lg:grid-cols-[1fr_360px] mt-20"
      >
        <fieldset
          disabled={isSubmitting}
          className="space-y-8 disabled:pointer-events-none disabled:opacity-60"
        >
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

          <div data-error-section={hasPhotoError ? "true" : undefined}>
            <OrderSection
              step="3"
              title="Fotky"
              description="Nahrajte minimálne 14 fotiek, ideálne aspoň 30. Vďaka väčšiemu počtu fotiek budú jednotlivé mesiace pestrejšie."
            >
              <Controller
                name="photos"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldDescription>
                      JPG, PNG alebo WEBP · minimálne 14 fotiek · maximálne 52
                      fotiek · max. 10 MB / fotka
                    </FieldDescription>

                    <PhotoDropzone
                      value={field.value ?? []}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                      hasPhotoError={hasPhotoError}
                    />

                    {hasPhotoError && (
                      <div className="mb-4 inline-flex items-center gap-2 rounded-md bg-[#FC5A61]/10 px-3 py-1.5 text-sm font-extrabold text-[#FC5A61]">
                        <AlertCircle className="size-4" />
                        <FieldError errors={[fieldState.error]} />
                      </div>
                    )}
                  </Field>
                )}
              />
            </OrderSection>
          </div>

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
        </fieldset>

        <aside className="lg:sticky lg:top-20 lg:self-start overflow-hidden rounded-md bg-white text-primary shadow-xl shadow-primary/10 ring-1 ring-soft">
          <div className="space-y-2">
            <PriceSummary
              type={selectedCalendarType}
              quantityOption={selectedQuantityOption}
              customQuantity={customQuantity}
              selectedPhotosQuantity={selectedPhotosQuantity}
              onQuantityChange={
                isSubmitting
                  ? undefined
                  : (quantity) => {
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
                    }
              }
              discountCode={discountCode}
              discountCodeError={discountCodeError}
              discountCodeTouched={discountCodeTouched}
              onDiscountCodeChange={(value) => {
                setDiscountCodeTouched(false);

                form.setValue("discountCode", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
              onDiscountCodeApply={() => {
                setDiscountCodeTouched(true);
              }}
              onDiscountCodeClear={() => {
                setDiscountCodeTouched(false);

                form.setValue("discountCode", "", {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
            />
            <FormConsentCheckbox control={form.control} className="px-6" />

            {turnstileSiteKey ? (
              <TurnstileWidget
                siteKey={turnstileSiteKey}
                onToken={(token) => setTurnstileToken(token)}
                onExpired={() => setTurnstileToken("")}
                onError={() => setTurnstileToken("")}
                className="px-6"
              />
            ) : null}

            <div className="px-6 pb-6">
              <Button
                type="submit"
                form="order-form"
                size="lg"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Odosielam objednávku...
                  </>
                ) : (
                  "Odoslať objednávku"
                )}
              </Button>
            </div>
            {submitError && (
              <p className="rounded-md border border-[#FC5A61]/30 bg-[#FFF7F4] p-3 text-sm font-semibold text-[#FC5A61]">
                {submitError}
              </p>
            )}
          </div>
        </aside>
      </form>
      <OrderSuccessDialog
        open={createdOrder !== null}
        orderCode={createdOrder?.orderCode}
        onOpenChange={(open) => {
          if (!open) {
            setCreatedOrder(null);
          }
        }}
      />
    </div>
  );
}
