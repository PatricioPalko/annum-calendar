import { OrderRow } from "@/app/types/types";
import { AdminCopyTextButton } from "@/components/admin/admin-copy-text-button";

type AdminOrderCustomerProps = {
  order: OrderRow;
};

export function AdminOrderCustomer({ order }: AdminOrderCustomerProps) {
  return (
    <div className="flex flex-col gap-1">
      <p className="font-bold">
        {order.first_name} {order.last_name}
      </p>

      <div className="flex flex-col gap-0.5">
        <AdminCopyTextButton
          value={order.email}
          className="w-full text-xs font-medium text-[#3E0F28]/65 max-w-44 lg:max-w-none"
        />

        {order.phone ? (
          <AdminCopyTextButton
            value={order.phone}
            className="w-full text-xs font-medium text-[#3E0F28]/55"
          />
        ) : (
          <p className="text-xs font-medium text-[#3E0F28]/55">Bez telefónu</p>
        )}
      </div>
    </div>
  );
}
