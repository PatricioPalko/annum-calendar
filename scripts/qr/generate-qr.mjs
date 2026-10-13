import QRCode from "qrcode";

const url = "https://annum.sk/letak";

await QRCode.toFile("./public/annum-qr.svg", url, {
  type: "svg",
  errorCorrectionLevel: "H",
  margin: 4,
});

console.log("QR code generated: public/annum-qr.svg");
