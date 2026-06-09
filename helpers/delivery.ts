export function getDeliveryPrice(method: "pickup" | "packeta") {
  switch (method) {
    case "pickup":
      return 0;
    case "packeta":
      return 3.9;
  }
}

export function getDeliveryLabel(method: "pickup" | "packeta") {
  switch (method) {
    case "pickup":
      return "Osobný odber";
    case "packeta":
      return "Packeta";
  }
}
