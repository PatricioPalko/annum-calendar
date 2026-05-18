import { calendarTypesValues, CUSTOM_QUANTITY_VALUE } from "@/app/types/types";
import { z } from "zod";

export const orderSchema = z
  .object({
    firstName: z.string().min(1, "Zadajte meno"),
    lastName: z.string().min(1, "Zadajte priezvisko"),

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
      .max(100, "Maximálne 100 kusov")
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.quantityOption === CUSTOM_QUANTITY_VALUE && !data.customQuantity) {
      ctx.addIssue({
        code: "custom",
        path: ["customQuantity"],
        message: "Zadajte vlastný počet kusov",
      });
    }
  });

export type OrderFormInput = z.input<typeof orderSchema>;
export type OrderFormValues = z.output<typeof orderSchema>;
