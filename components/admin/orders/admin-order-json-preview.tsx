import { FileJson2 } from "lucide-react";

import { OrderRow } from "@/app/types/types";
import { getOrderJsonPreview } from "@/helpers/admin-orders";

type AdminOrderJsonPreviewProps = {
  order: OrderRow;
};

export function AdminOrderJsonPreview({ order }: AdminOrderJsonPreviewProps) {
  const preview = getOrderJsonPreview(order);

  return (
    <details className="group text-left">
      <summary className="inline-flex cursor-pointer h-8 list-none items-center gap-1 rounded-md border border-[#EAD6DE] bg-white px-2.5 py-1 text-xs font-bold text-[#3E0F28] transition hover:bg-[#FFF7F4]">
        <FileJson2 className="size-3.5" />
        JSON
      </summary>

      <div className="absolute right-6 z-20 mt-2 max-h-96 w-[520px] max-w-[calc(100vw-3rem)] overflow-auto rounded-xl border border-[#EAD6DE] bg-[#180914] p-4 text-left shadow-2xl shadow-[#3E0F28]/25">
        <pre className="whitespace-pre-wrap text-xs leading-5 text-[#FFF7F4]">
          {JSON.stringify(preview, null, 2)}
        </pre>
      </div>
    </details>
  );
}
