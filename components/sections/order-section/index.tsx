import { Heading, Text } from "@/components/ui/typography";

type OrderSectionProps = {
  step: string;
  title: string;
  description?: string;
  children: React.ReactNode;
};

export default function OrderSection({
  step,
  title,
  description,
  children,
}: OrderSectionProps) {
  return (
    <section className="border-b-2 border-[#EAD6DE]/40 bg-white mx-6 pt-4 pb-8">
      <div className="mb-6 flex gap-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#FC5A61] text-md font-extrabold text-white">
          {step}
        </div>

        <div>
          <Heading
            as="h4"
            className="font-heading text-2xl font-bold text-[#3E0F28]"
          >
            {title}
          </Heading>

          {description && <Text>{description}</Text>}
        </div>
      </div>

      <div>{children}</div>
    </section>
  );
}
