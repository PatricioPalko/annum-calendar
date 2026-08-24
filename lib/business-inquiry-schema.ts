import { z } from "zod";

import { isValidSlovakPhone, normalizePhone } from "@/helpers/phone";

export const businessInquirySchema = z.object({
  company: z.string().trim().min(1, "Zadajte názov firmy"),
  firstName: z.string().trim().min(1, "Zadajte meno"),
  lastName: z.string().trim().min(1, "Zadajte priezvisko"),
  email: z.email("Zadajte platnú e-mailovú adresu"),
  phone: z
    .string()
    .trim()
    .transform((value) => normalizePhone(value))
    .refine((value) => isValidSlovakPhone(value), {
      message: "Zadajte platné slovenské telefónne číslo.",
    }),
  quantity: z
    .number()
    .int("Zadajte celé číslo")
    .min(10, "Firemná ponuka je dostupná od 10 kusov")
    .max(500, "Pre väčší počet nás kontaktujte e-mailom"),
  message: z
    .string()
    .max(1000, "Správa môže mať maximálne 1000 znakov")
    .optional(),
});

export type BusinessInquiryValues = z.infer<typeof businessInquirySchema>;
