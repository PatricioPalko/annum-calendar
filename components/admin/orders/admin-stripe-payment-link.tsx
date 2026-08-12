import { OrderRow } from "@/app/types/types";
import { getStripePaymentDashboardUrl } from "@/helpers/stripe-dashboard";

type AdminStripePaymentLinkProps = {
  order: OrderRow;
};

export function AdminStripePaymentLink({ order }: AdminStripePaymentLinkProps) {
  const href = getStripePaymentDashboardUrl(order);

  if (!href) {
    return null;
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="cursor-pointer text-[11px] font-semibold text-[#3E0F28]/45 transition hover:text-[#635BFF]"
      title="Otvoriť platbu v Stripe dashboarde"
    >
      Stripe →
    </a>
  );
}
