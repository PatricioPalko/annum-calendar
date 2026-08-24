"use client";
import {
  hasPremiumCalendarFeatures,
  isMemoryCalendarType,
  orderableCalendarTypes,
  resolveQuantity,
} from "@/app/types/types";
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
import { getDiscountCode } from "@/helpers/discount-codes";
import { getFinalQuantity } from "@/helpers/form";
import { getOrderFormStepCompletion, getOrderFormStepCount } from "@/helpers/order-form-step-completion";
import {
  clearOrderFormDraft,
  loadOrderFormDraft,
  saveOrderFormDraft,
} from "@/lib/order-from-draft";
import { OrderFormValues, orderSchema } from "@/lib/schema";
import { uploadOrderPhotos } from "@/lib/upload-order-photos";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { BirthdaysFieldArray } from "../order-form-components/form-birthdays";
import { FormConsentCheckbox } from "../order-form-components/form-consent-checkbox";
import { FormDeliveryMethod } from "../order-form-components/form-delivery-method";
import { FormDedication } from "../order-form-components/form-dedication";
import { FormInput } from "../order-form-components/form-input";
import { NamedaysFieldArray } from "../order-form-components/form-namedays";
import { PhotoDropzone } from "../order-form-components/form-photo-dropzone";
import { PriceSummary } from "../order-form-components/form-price-summary";
import { FormQuantity } from "../order-form-components/form-quantity";
import { FormRadioGroup } from "../order-form-components/form-radiogroup";
import { FormTextarea } from "../order-form-components/form-textarea";
import { orderFormFieldHintClassName } from "../order-form-components/order-form-styles";
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
  dedications: [],
  deliveryMethod: "packeta",
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

  const appliedDiscount = getDiscountCode(normalizedDiscountCode);
  const showPickupOption = Boolean(appliedDiscount?.allowsPickup);

  const discountCodeError =
    normalizedDiscountCode && !getDiscountCode(normalizedDiscountCode)
      ? "Zľavový kód nie je platný."
      : undefined;

  const errors = form.formState.errors;

  const hasPhotoError = Boolean(errors.photos);
  const hasDedicationError = Boolean(errors.dedications);
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
  const watchedFormValues = form.watch();
  const formErrors = form.formState.errors;
  const hasPremiumFeatures = hasPremiumCalendarFeatures(selectedCalendarType);
  const isMemoryType = isMemoryCalendarType(selectedCalendarType);

  const { steps: stepCompletion, activeStep } = useMemo(
    () => getOrderFormStepCompletion(watchedFormValues, formErrors),
    [watchedFormValues, formErrors],
  );

  const totalSteps = getOrderFormStepCount(selectedCalendarType);
  const dedicationQuantity =
    resolveQuantity({
      quantityOption: selectedQuantityOption,
      customQuantity,
    }) ?? 1;
  const deliveryStepNumber = isMemoryType ? 7 : hasPremiumFeatures ? 6 : 4;
  const contactStepNumber = deliveryStepNumber + 1;
  const noteStepNumber = contactStepNumber + 1;

  useEffect(() => {
    const draft = loadOrderFormDraft();

    if (!draft) {
      return;
    }

    form.reset({
      ...orderFormDefaultValues,
      ...draft,
      types:
        (draft as { types?: string }).types === "business"
          ? "premium"
          : (draft.types ?? orderFormDefaultValues.types),
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
    if (hasPremiumFeatures) {
      return;
    }

    form.setValue("birthdays", [], {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("namedays", [], {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.setValue("dedications", [], {
      shouldDirty: true,
      shouldValidate: true,
    });
  }, [hasPremiumFeatures, form]);

  useEffect(() => {
    if (!isMemoryType) {
      form.setValue("dedications", [], {
        shouldDirty: true,
        shouldValidate: true,
      });
      return;
    }

    const current = form.getValues("dedications") ?? [];

    if (current.length === dedicationQuantity) {
      return;
    }

    form.setValue(
      "dedications",
      Array.from(
        { length: dedicationQuantity },
        (_, index) => current[index] ?? "",
      ),
      {
        shouldDirty: true,
        shouldValidate: true,
      },
    );
  }, [isMemoryType, dedicationQuantity, form]);

  useEffect(() => {
    if (showPickupOption) {
      return;
    }

    if (form.getValues("deliveryMethod") === "pickup") {
      form.setValue("deliveryMethod", "packeta", {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [showPickupOption, form]);

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
        note: values.note?.trim() || undefined,

        dedications:
          values.types === "memory"
            ? values.dedications.map((entry) => (entry ?? "").trim())
            : undefined,

        type: values.types,
        quantity,

        photos: uploaded.photos,
        birthdays: hasPremiumCalendarFeatures(values.types)
          ? values.birthdays
          : [],
        namedays: hasPremiumCalendarFeatures(values.types)
          ? values.namedays
          : [],

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
    <div className="text-primary">
      <form
        onSubmit={form.handleSubmit(onSubmit, scrollToErrorSection)}
        id="order-form"
        className="grid items-start gap-6 pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] lg:gap-8 lg:pb-0 xl:grid-cols-[minmax(0,1fr)_360px]"
      >
        <fieldset
          disabled={isSubmitting}
          className="min-w-0 space-y-4 sm:space-y-5 disabled:pointer-events-none disabled:opacity-60"
        >
          <OrderSection
            stepNumber={1}
            totalSteps={totalSteps}
            title="Typ kalendára"
            description="Basic alebo Premium s meninami a narodeninami."
            isComplete={stepCompletion.type}
            isActive={activeStep === "type"}
          >
            <FormRadioGroup
              control={form.control}
              name="types"
              label="Typ kalendára"
              options={orderableCalendarTypes}
            />
          </OrderSection>

          <div data-error-section={hasQuantityError ? "true" : undefined}>
            <OrderSection
              stepNumber={2}
              totalSteps={totalSteps}
              title="Počet kusov"
              description="Viac kusov = nižšia cena za kalendár."
              isComplete={stepCompletion.quantity}
              isActive={activeStep === "quantity"}
            >
              <FormQuantity
                control={form.control}
                name="quantityOption"
                selectedCalendarType={selectedCalendarType}
              />
            </OrderSection>
          </div>

          <div data-error-section={hasPhotoError ? "true" : undefined}>
            <OrderSection
              stepNumber={3}
              totalSteps={totalSteps}
              title="Vaše fotky"
              description={`Min. ${MIN_PHOTOS} fotiek, odporúčame 30+. Formát na výšku aj na šírku.`}
              isComplete={stepCompletion.photos}
              isActive={activeStep === "photos"}
            >
              <Controller
                name="photos"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldDescription className={orderFormFieldHintClassName}>
                      {`JPG, PNG alebo WEBP · min. ${MIN_PHOTOS} fotiek · max. ${MAX_PHOTOS} · max. 10 MB / fotka`}
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

          {isMemoryType && (
            <div data-error-section={hasDedicationError ? "true" : undefined}>
              <OrderSection
                stepNumber={4}
                totalSteps={totalSteps}
                title="Venovanie"
                description={
                  dedicationQuantity > 1
                    ? `Voliteľné — pre každý z ${dedicationQuantity} kalendárov môžete zadať vlastné venovanie.`
                    : "Voliteľné — ak chcete kalendár niekomu venovať, napíšte text priamo do kalendára."
                }
                isComplete={stepCompletion.dedication}
                isActive={activeStep === "dedication"}
                isOptional
              >
                <FormDedication
                  control={form.control}
                  quantity={dedicationQuantity}
                />
              </OrderSection>
            </div>
          )}

          {hasPremiumFeatures && (
            <>
              <div data-error-section={hasBirthdayError ? "true" : undefined}>
                <OrderSection
                  stepNumber={isMemoryType ? 5 : 4}
                  totalSteps={totalSteps}
                  title="Narodeniny"
                  description="Voliteľné — doplňte narodeniny, ktoré chcete v kalendári zvýrazniť."
                  isComplete={stepCompletion.birthdays}
                  isActive={activeStep === "birthdays"}
                  isOptional
                >
                  <BirthdaysFieldArray
                    control={form.control}
                    trigger={form.trigger}
                  />
                </OrderSection>
              </div>

              <OrderSection
                stepNumber={isMemoryType ? 6 : 5}
                totalSteps={totalSteps}
                title="Meniny"
                description="Voliteľné — vyberte mená, ktorých meniny chcete v kalendári."
                isComplete={stepCompletion.namedays}
                isActive={activeStep === "namedays"}
                isOptional
              >
                <NamedaysFieldArray control={form.control} />
              </OrderSection>
            </>
          )}
          <div data-error-section={hasDeliveryError ? "true" : undefined}>
            <OrderSection
              stepNumber={deliveryStepNumber}
              totalSteps={totalSteps}
              title="Doručenie"
              description={
                showPickupOption
                  ? "Osobný odber v Košiciach alebo Packeta."
                  : "Packeta na výdajné miesto alebo Z-BOX."
              }
              isComplete={stepCompletion.delivery}
              isActive={activeStep === "delivery"}
            >
              <FormDeliveryMethod
                control={form.control}
                showPickup={showPickupOption}
                isSubmitting={isSubmitting}
              />
            </OrderSection>
          </div>
          <div data-error-section={hasContactError ? "true" : undefined}>
            <OrderSection
              stepNumber={contactStepNumber}
              totalSteps={totalSteps}
              title="Kontaktné údaje"
              description="Len na spracovanie objednávky."
              isComplete={stepCompletion.contact}
              isActive={activeStep === "contact"}
            >
              <FieldGroup className="grid gap-3 sm:grid-cols-2 sm:gap-4">
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
            stepNumber={noteStepNumber}
            totalSteps={totalSteps}
            title="Poznámka k objednávke"
            isComplete={stepCompletion.note}
            isActive={activeStep === "note"}
            isOptional
          >
            <FormTextarea
              control={form.control}
              name="note"
              label="Poznámka k objednávke"
              placeholder="Napríklad špeciálne prianie pri príprave kalendára…"
            />

            <Button
              type="button"
              variant="secondary"
              className="mt-3 w-full lg:hidden"
              onClick={() => {
                document
                  .getElementById("order-summary")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              Prejsť k súhrnu objednávky
            </Button>
          </OrderSection>
        </fieldset>

        <aside
          id="order-summary"
          className="min-w-0 scroll-mt-24 overflow-hidden rounded-xl border border-[#EAD6DE] bg-white shadow-md lg:sticky lg:top-20 lg:self-start"
        >
          <div>
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
              <FormConsentCheckbox control={form.control} className="px-4 sm:px-5" />
            </div>

            {turnstileConfigured ? (
              <div
                data-error-section={hasTurnstileError ? "true" : undefined}
                className="px-4 sm:px-5"
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
              <p className="px-5 text-sm font-semibold text-[#FC5A61]">
                Overenie formulára nie je nakonfigurované. Objednávku momentálne
                nie je možné odoslať.
              </p>
            )}

            <div className="hidden border-t border-[#EAD6DE]/60 px-4 py-4 sm:px-5 lg:block">
              <Button
                type="submit"
                form="order-form"
                size="lg"
                variant="lime"
                className="w-full"
                disabled={form.formState.isSubmitting || !canSubmitWithTurnstile}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Dokončujem...
                  </>
                ) : (
                  "Dokončiť objednávku"
                )}
              </Button>
            </div>
            {hasSubmitError && (
              <p
                role="alert"
                data-submit-error="true"
                data-error-section="true"
                className="mx-4 mb-4 rounded-lg border border-[#FC5A61]/30 bg-[#FFF7F4] p-3 text-sm font-semibold text-[#FC5A61] sm:mx-5"
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
