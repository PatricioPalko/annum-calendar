import { calendarTypesValues, CUSTOM_QUANTITY_VALUE } from "@/app/types/types";
import { isValidCalendarDayMonth } from "@/helpers/calendar-date";
import { discountAllowsPickup } from "@/helpers/discount-codes";
import { normalizePhone } from "@/helpers/phone";
import {
  MAX_BIRTHDAY_NAME_LENGTH,
  MAX_PHOTOS,
  MIN_PHOTOS,
} from "@/lib/order/config";
import { z } from "zod";
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const birthdaySchema = z
  .object({
    day: z.number().int().min(1, "Deň je povinný").max(31),
    month: z.number().int().min(1, "Mesiac je povinný").max(12),
    name: z
      .string()
      .trim()
      .min(1, "Zadajte meno")
      .max(
        MAX_BIRTHDAY_NAME_LENGTH,
        `Meno môže mať maximálne ${MAX_BIRTHDAY_NAME_LENGTH} znakov.`,
      ),
  })
  .superRefine((value, ctx) => {
    if (!isValidCalendarDayMonth(value.day, value.month)) {
      ctx.addIssue({
        code: "custom",
        path: ["day"],
        message: "Neplatný dátum.",
      });
    }
  });

const namedaySchema = z.object({
  name: z.string().min(1, "Zadajte meno"),
});

export const orderSchema = z
  .object({
    firstName: z.string().min(1, "Zadajte meno"),
    lastName: z.string().min(1, "Zadajte priezvisko"),
    email: z.email("Zadajte platnú e-mailovu adresu"),
    phone: z
      .string()
      .trim()
      .transform((value) => normalizePhone(value))
      .pipe(
        z
          .string()
          .min(9, {
            message: "Zadajte telefónne číslo v tvare +421 9xx xxx xxx.",
          })
          .regex(/^(\+421|0)?9\d{8}$/, {
            message: "Zadajte platné slovenské telefónne číslo.",
          }),
      ),
    note: z
      .string()
      .max(500, "Poznámka môže mať maximálne 500 znakov")
      .optional(),

    types: z.enum(calendarTypesValues),
    quantityOption: z.union([
      z.literal(1),
      z.literal(3),
      z.literal(5),
      z.literal(CUSTOM_QUANTITY_VALUE),
    ]),

    customQuantity: z
      .number()
      .int("Zadajte celé číslo")
      .min(1, "Minimálne 1 kus")
      .max(200, "Maximálne 200 kusov")
      .optional(),

    photos: z
      .array(z.instanceof(File))
      .min(MIN_PHOTOS, `Nahrajte aspoň ${MIN_PHOTOS} fotiek`)
      .max(MAX_PHOTOS, `Nahrajte maximálne ${MAX_PHOTOS} fotiek`)
      .refine(
        (files) => files.every((file) => file.size <= MAX_FILE_SIZE),
        "Jedna fotka môže mať maximálne 10 MB",
      ),

    birthdays: z.array(birthdaySchema),
    namedays: z.array(namedaySchema),
    termsAccepted: z.boolean().refine((value) => value === true, {
      message: "Pre odoslanie objednávky je potrebné potvrdiť súhlas.",
    }),
    marketingConsent: z.boolean().optional(),
    deliveryMethod: z.enum(["pickup", "packeta"]),
    packetaPoint: z
      .object({
        id: z.string().min(1),
        name: z.string().min(1),
        address: z.string().min(1),
      })
      .optional(),
    discountCode: z
      .string()
      .max(40)
      .transform((value) => value.trim().toUpperCase())
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.quantityOption === CUSTOM_QUANTITY_VALUE &&
      data.customQuantity === undefined
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["customQuantity"],
        message: "Zadajte vlastný počet kusov",
      });
    }

    if (
      data.types === "business" &&
      data.quantityOption === CUSTOM_QUANTITY_VALUE &&
      data.customQuantity !== undefined &&
      data.customQuantity < 10
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["customQuantity"],
        message: "Business objednávka je dostupná od 10 kusov",
      });
    }

    if (data.deliveryMethod === "packeta" && !data.packetaPoint) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["packetaPoint"],
        message: "Vyberte výdajné miesto alebo Z-BOX Packety.",
      });
    }

    if (
      data.deliveryMethod === "pickup" &&
      !discountAllowsPickup(data.discountCode)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["deliveryMethod"],
        message: "Osobný odber je dostupný len so zľavovým kódom RODINA15.",
      });
    }
  });

export type OrderFormInput = z.input<typeof orderSchema>;
export type OrderFormValues = z.output<typeof orderSchema>;
