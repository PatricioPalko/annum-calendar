export async function downloadOrderPhotos(orderId: string, fileName: string) {
  const response = await fetch(`/api/admin/orders/${orderId}/download`);

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    console.error("ADMIN_DOWNLOAD_ERROR:", {
      status: response.status,
      errorText,
    });
    throw new Error("Download failed");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}.zip`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function createPacketaLabel(orderId: string) {
  const response = await fetch(
    `/api/admin/orders/${orderId}/create-packeta-packet`,
    { method: "POST" },
  );

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;

    throw new Error(
      payload?.message ?? "Nepodarilo sa vytvoriť štítok v Packete.",
    );
  }
}

export async function notifyOrderFulfillment(
  orderId: string,
  trackingNumber?: string,
) {
  const response = await fetch(
    `/api/admin/orders/${orderId}/notify-fulfillment`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        trackingNumber: trackingNumber || undefined,
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    console.error("NOTIFY_FULFILLMENT_ERROR:", {
      status: response.status,
      errorText,
    });
    throw new Error("Notify fulfillment failed");
  }
}

export async function completeOrder(orderId: string) {
  const response = await fetch(`/api/admin/orders/${orderId}/complete`, {
    method: "POST",
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    console.error("COMPLETE_ORDER_ERROR:", {
      status: response.status,
      errorText,
    });
    throw new Error("Complete order failed");
  }
}
