"use client";
import { calendarTypes, CUSTOM_QUANTITY_VALUE } from "@/app/types/types";
import { PacketaPicker } from "@/components/delivery/packeta-picker";
import {
  TurnstileWidget,
  type TurnstileWidgetHandle,
} from "@/components/security/turnstile-widget";
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
import {
  clearOrderFormDraft,
  loadOrderFormDraft,
  saveOrderFormDraft,
} from "@/lib/order-from-draft";
import { OrderFormValues, orderSchema } from "@/lib/schema";
import { uploadOrderPhotos } from "@/lib/upload-order-photos";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { BirthdaysFieldArray } from "../order-form-components/form-birthdays";
import { FormConsentCheckbox } from "../order-form-components/form-consent-checkbox";
import { FormDeliveryMethod } from "../order-form-components/form-delivery-method";
import { FormInput } from "../order-form-components/form-input";
import { NamedaysFieldArray } from "../order-form-components/form-namedays";
import { PhotoDropzone } from "../order-form-components/form-photo-dropzone";
import { PriceSummary } from "../order-form-components/form-price-summary";
import { FormQuantity } from "../order-form-components/form-quantity";
import { FormRadioGroup } from "../order-form-components/form-radiogroup";
import { FormTextarea } from "../order-form-components/form-textarea";
import { OrderFormMobileBar } from "../order-form-components/order-form-mobile-bar";
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
  marketingConsent: false,
  discountCode: "",
  deliveryMethod: "pickup",
  packetaPoint: undefined,
};

import { MAX_PHOTOS, MIN_PHOTOS } from "@/lib/order/config";

export default function OrderForm() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const turnstileRef = useRef<TurnstileWidgetHandle>(null);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

  function resetTurnstile() {
    setTurnstileToken("");
    turnstileRef.current?.reset();
  }

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: orderFormDefaultValues,
  });

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

  const errors = form.formState.errors;

  const hasPhotoError = Boolean(errors.photos);
  const hasQuantityError = Boolean(
    errors.quantityOption || errors.customQuantity,
  );
  const hasBirthdayError = Boolean(errors.birthdays);
  const hasDeliveryError = Boolean(
    errors.deliveryMethod || errors.packetaPoint,
  );
  const hasContactError = Boolean(
    errors.firstName ||
      errors.lastName ||
      errors.email ||
      errors.phone,
  );
  const hasTermsError = Boolean(errors.termsAccepted);
  const hasTurnstileError =
    Boolean(turnstileSiteKey) &&
    !turnstileToken &&
    form.formState.isSubmitted;
  const hasSubmitError = Boolean(submitError);
  const turnstileConfigured = Boolean(turnstileSiteKey);
  const canSubmitWithTurnstile = !turnstileConfigured || Boolean(turnstileToken);
  const selectedDeliveryMethod = form.watch("deliveryMethod");

  useEffect(() => {
    const draft = loadOrderFormDraft();

    if (!draft) {
      return;
    }

    form.reset({
      ...orderFormDefaultValues,
      ...draft,
      photos: [],
    });
  }, [form]);

  useEffect(() => {
    const subscription = form.watch((values) => {
      saveOrderFormDraft({
        ...orderFormDefaultValues,
        ...values,
        photos: values.photos ?? [],
      } as OrderFormValues);
    });

    return () => subscription.unsubscribe();
  }, [form]);

  useEffect(() => {
    if (selectedCalendarType === "business") {
      form.setValue("quantityOption", CUSTOM_QUANTITY_VALUE, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }

    if (selectedCalendarType !== "premium") {
      form.setValue("birthdays", [], {
        shouldDirty: true,
        shouldValidate: true,
      });
      form.setValue("namedays", [], {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [selectedCalendarType, form]);

  useEffect(() => {
    if (!submitError) {
      return;
    }

    requestAnimationFrame(() => {
      document
        .querySelector("[data-submit-error='true']")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }, [submitError]);

  function resetOrderFormState() {
    clearOrderFormDraft();
    form.reset(orderFormDefaultValues);
    resetTurnstile();
    setDiscountCodeTouched(false);
    setSubmitError(null);
  }

  function scrollToErrorSection() {
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
      setSubmitError(null);

      if (turnstileConfigured && !turnstileToken) {
        setSubmitError("Prosím potvrďte, že nie ste robot.");
        return;
      }

      const quantity = getFinalQuantity(values);

      const uploaded = await uploadOrderPhotos({
        firstName: values.firstName,
        lastName: values.lastName,
        files: values.photos,
        type: values.types,
        quantity,
        turnstileToken,
      });

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
        birthdays: values.types === "premium" ? values.birthdays : [],
        namedays: values.types === "premium" ? values.namedays : [],

        deliveryMethod: values.deliveryMethod,
        packetaPoint:
          values.deliveryMethod === "packeta" ? values.packetaPoint : undefined,

        termsAccepted: values.termsAccepted,
        marketingConsent: values.marketingConsent ?? false,
        discountCode: values.discountCode?.trim() || undefined,
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();

        console.error("CREATE_ORDER_RESPONSE_ERROR:", {
          status: response.status,
          errorText,
        });

        throw new Error("Objednávku sa nepodarilo odoslať.");
      }

      const result = await response.json();

      if (result.checkoutUrl) {
        resetOrderFormState();
        window.location.href = result.checkoutUrl;
        return;
      }

      throw new Error("Missing checkout URL");
    } catch (error) {
      console.error("ORDER_SUBMIT_ERROR:", error);

      resetTurnstile();
      setSubmitError(
        "Objednávku sa nepodarilo odoslať. Skúste to prosím znova alebo nás kontaktujte.",
      );
    }
  }

  return (
    <div className="mx-auto mt-6 max-w-7xl rounded-xl border border-[#EAD6DE] bg-white px-3 py-8 text-primary shadow-2xl shadow-[#3E0F28]/10 sm:px-4 md:px-6 lg:pb-10">
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
        onSubmit={form.handleSubmit(onSubmit, scrollToErrorSection)}
        id="order-form"
        className="grid gap-4 pb-[calc(4.25rem+env(safe-area-inset-bottom))] lg:grid-cols-[minmax(0,1fr)_360px] lg:pb-0 lg:pt-8"
      >
        <fieldset
          disabled={isSubmitting}
          className="min-w-0 space-y-8 disabled:pointer-events-none disabled:opacity-60"
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

          <div data-error-section={hasQuantityError ? "true" : undefined}>
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
          </div>

          <div data-error-section={hasPhotoError ? "true" : undefined}>
            <OrderSection
              step="3"
              title="Fotky"
              description={`Nahrajte minimálne ${MIN_PHOTOS}, ideálne aspoň 30. Vďaka väčšiemu počtu fotiek budú jednotlivé mesiace pestrejšie.`}
            >
              <Controller
                name="photos"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldDescription>
                      {`JPG, PNG alebo WEBP · minimálne ${MIN_PHOTOS} fotiek ·
                      maximálne ${MAX_PHOTOS} fotiek · max. 10 MB / fotka`}
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
              <div data-error-section={hasBirthdayError ? "true" : undefined}>
                <OrderSection
                  step="4"
                  title="Dôležité narodeniny"
                  description="Doplňte narodeniny, ktoré chcete mať v kalendári zvýraznené."
                >
                  <div className="space-y-8">
                    <BirthdaysFieldArray
                      control={form.control}
                      trigger={form.trigger}
                    />
                  </div>
                </OrderSection>
              </div>
              <OrderSection
                step="5"
                title="Dôležité meniny"
                description="Doplňte meniny, ktoré chcete mať v kalendári zvýraznené."
              >
                <div className="space-y-8">
                  <NamedaysFieldArray control={form.control} />
                </div>
              </OrderSection>
            </>
          )}
          <div data-error-section={hasDeliveryError ? "true" : undefined}>
            <OrderSection
              step={selectedCalendarType === "premium" ? "6" : "4"}
              title="Doručenie"
              description="Vyberte, či si kalendár prevezmete osobne v Košiciach alebo cez Packetu."
            >
              <FormDeliveryMethod control={form.control} />

              {form.watch("deliveryMethod") === "packeta" && (
                <Controller
                  control={form.control}
                  name="packetaPoint"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <PacketaPicker
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isSubmitting}
                      />

                      {fieldState.error && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              )}
            </OrderSection>
          </div>
          <div data-error-section={hasContactError ? "true" : undefined}>
            <OrderSection
              step={selectedCalendarType === "premium" ? "7" : "5"}
              title="Kontaktné údaje"
              description="Tieto údaje použijeme len na spracovanie objednávky."
            >
              <FieldGroup className="grid gap-4 md:grid-cols-2">
                <FormInput
                  control={form.control}
                  name="firstName"
                  label="Meno"
                  type="text"
                  autoComplete="given-name"
                  placeholder="Ján"
                />
                <FormInput
                  control={form.control}
                  name="lastName"
                  label="Priezvisko"
                  type="text"
                  autoComplete="family-name"
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
                  autoComplete="tel"
                  type="tel"
                  placeholder="+421 9xx xxx xxx"
                />
              </FieldGroup>
            </OrderSection>
          </div>

          <OrderSection
            step={selectedCalendarType === "premium" ? "8" : "6"}
            title="Poznámka"
            description="Poznámka k objednávke"
          >
            <FormTextarea control={form.control} name="note" label="Poznámka" />
          </OrderSection>
        </fieldset>

        <aside
          id="order-summary"
          className="min-w-0 scroll-mt-24 overflow-hidden rounded-md bg-white text-primary shadow-xl shadow-primary/10 ring-1 ring-soft lg:sticky lg:top-20 lg:self-start"
        >
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
              deliveryMethod={selectedDeliveryMethod}
            />
            <div data-error-section={hasTermsError ? "true" : undefined}>
              <FormConsentCheckbox control={form.control} className="px-3 sm:px-5" />
            </div>

            {turnstileConfigured ? (
              <div
                data-error-section={hasTurnstileError ? "true" : undefined}
                className="px-3 sm:px-5"
              >
                <TurnstileWidget
                  ref={turnstileRef}
                  siteKey={turnstileSiteKey}
                  responsive
                  onToken={(token) => setTurnstileToken(token)}
                  onExpired={() => setTurnstileToken("")}
                  onError={() => setTurnstileToken("")}
                />

                {hasTurnstileError && (
                  <p
                    role="alert"
                    className="mt-2 text-sm font-semibold text-[#FC5A61]"
                  >
                    Prosím potvrďte, že nie ste robot.
                  </p>
                )}
              </div>
            ) : (
              <p className="px-6 text-sm font-semibold text-[#FC5A61]">
                Overenie formulára nie je nakonfigurované. Objednávku momentálne
                nie je možné odoslať.
              </p>
            )}

            <div className="hidden px-5 pb-6 lg:block">
              <Button
                type="submit"
                form="order-form"
                size="lg"
                className="w-full"
                disabled={form.formState.isSubmitting || !canSubmitWithTurnstile}
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
            {hasSubmitError && (
              <p
                role="alert"
                data-submit-error="true"
                data-error-section="true"
                className="mx-3 mb-6 rounded-md border border-[#FC5A61]/30 bg-[#FFF7F4] p-3 text-sm font-semibold text-[#FC5A61] sm:mx-5"
              >
                {submitError}
              </p>
            )}
          </div>
        </aside>
      </form>

      <OrderFormMobileBar
        type={selectedCalendarType}
        quantityOption={selectedQuantityOption}
        customQuantity={customQuantity}
        deliveryMethod={selectedDeliveryMethod}
        discountCode={discountCode}
        isSubmitting={isSubmitting}
        submitDisabled={!canSubmitWithTurnstile}
      />
    </div>
  );
}
