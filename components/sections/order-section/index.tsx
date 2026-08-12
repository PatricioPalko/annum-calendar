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
    <section className="scroll-mt-24 border-b-2 border-[#EAD6DE]/40 bg-white px-1 pb-8 pt-4 sm:px-2">
      <div className="mb-6 flex gap-3 sm:gap-4">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#FC5A61] text-md font-extrabold text-white sm:size-9">
          {step}
        </div>

        <div className="min-w-0">
          <Heading as="h3">{title}</Heading>

          {description && <Text>{description}</Text>}
        </div>
      </div>

      <div>{children}</div>
    </section>
  );
}
