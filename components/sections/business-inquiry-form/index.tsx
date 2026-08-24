"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  businessInquirySchema,
  type BusinessInquiryValues,
} from "@/lib/business-inquiry-schema";

const defaultValues: BusinessInquiryValues = {
  company: "",
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  quantity: 10,
  message: "",
};

export function BusinessInquiryForm() {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<BusinessInquiryValues>({
    resolver: zodResolver(businessInquirySchema),
    mode: "onTouched",
    defaultValues,
  });

  async function onSubmit(values: BusinessInquiryValues) {
    setSubmitError(null);

    try {
      const response = await fetch("/api/business-inquiry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Submit failed");
      }

      form.reset(defaultValues);
      setIsSuccess(true);
    } catch {
      setSubmitError(
        "Dopyt sa nepodarilo odoslať. Skúste to prosím znova alebo napíšte na info@annum.sk.",
      );
    }
  }

  if (isSuccess) {
    return (
      <div className="rounded-xl border border-[#EAD6DE] bg-[#FFF7F4] px-5 py-6 text-center">
        <p className="font-bold text-primary">Ďakujeme — dopyt sme prijali.</p>
        <p className="mt-2 text-sm font-medium leading-6 text-primary/65">
          Ozveme sa vám e-mailom alebo telefonicky s nezáväznou ponukou.
        </p>
        <Button
          type="button"
          variant="secondary"
          className="mt-5"
          onClick={() => setIsSuccess(false)}
        >
          Odoslať ďalší dopyt
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="rounded-xl border border-[#EAD6DE] bg-white px-4 py-6 shadow-lg shadow-[#3E0F28]/5 sm:px-6"
    >
      <FieldGroup className="grid gap-4 md:grid-cols-2">
        <Field data-invalid={Boolean(form.formState.errors.company)}>
          <FieldLabel htmlFor="company">Názov firmy</FieldLabel>
          <Input id="company" {...form.register("company")} />
          <FieldError errors={[form.formState.errors.company]} />
        </Field>

        <Field data-invalid={Boolean(form.formState.errors.quantity)}>
          <FieldLabel htmlFor="quantity">Počet kalendárov (min. 10)</FieldLabel>
          <Input
            id="quantity"
            type="text"
            inputMode="numeric"
            {...form.register("quantity", { valueAsNumber: true })}
          />
          <FieldError errors={[form.formState.errors.quantity]} />
        </Field>

        <Field data-invalid={Boolean(form.formState.errors.firstName)}>
          <FieldLabel htmlFor="firstName">Meno</FieldLabel>
          <Input id="firstName" {...form.register("firstName")} />
          <FieldError errors={[form.formState.errors.firstName]} />
        </Field>

        <Field data-invalid={Boolean(form.formState.errors.lastName)}>
          <FieldLabel htmlFor="lastName">Priezvisko</FieldLabel>
          <Input id="lastName" {...form.register("lastName")} />
          <FieldError errors={[form.formState.errors.lastName]} />
        </Field>

        <Field data-invalid={Boolean(form.formState.errors.email)}>
          <FieldLabel htmlFor="email">E-mail</FieldLabel>
          <Input id="email" type="email" {...form.register("email")} />
          <FieldError errors={[form.formState.errors.email]} />
        </Field>

        <Field data-invalid={Boolean(form.formState.errors.phone)}>
          <FieldLabel htmlFor="phone">Telefón</FieldLabel>
          <Input id="phone" type="tel" {...form.register("phone")} />
          <FieldError errors={[form.formState.errors.phone]} />
        </Field>
      </FieldGroup>

      <Field className="mt-4" data-invalid={Boolean(form.formState.errors.message)}>
        <FieldLabel htmlFor="message">Správa (voliteľné)</FieldLabel>
        <Textarea
          id="message"
          rows={4}
          placeholder="Napr. logo na titulke, firemné fotky, termín dodania…"
          {...form.register("message")}
        />
        <FieldError errors={[form.formState.errors.message]} />
      </Field>

      {submitError && (
        <p className="mt-4 text-sm font-semibold text-destructive">{submitError}</p>
      )}

      <Button
        type="submit"
        variant="lime"
        size="lg"
        className="mt-6 w-full sm:w-auto"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Odosielam…
          </>
        ) : (
          "Odoslať nezáväzný dopyt"
        )}
      </Button>
    </form>
  );
}
