import type { PrintZone, Transform } from "@/features/configurator/mockups";

export interface DesignPreviewInput {
  mockupUrl: string;
  imageUrl: string;
  zone: PrintZone;
  transform: Transform;
  previewSize: number;
  /** Подпись для исполнителя, напр. «Лицевая сторона · M» */
  label?: string;
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Не удалось подготовить превью"));
    image.src = src;
  });
}

export async function renderDesignPreview(input: DesignPreviewInput): Promise<Blob> {
  const [mockup, print] = await Promise.all([loadImage(input.mockupUrl), loadImage(input.imageUrl)]);
  const size = 1200;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Браузер не поддерживает создание превью");

  const mockupScale = Math.min(size / mockup.naturalWidth, size / mockup.naturalHeight);
  const mockupWidth = mockup.naturalWidth * mockupScale;
  const mockupHeight = mockup.naturalHeight * mockupScale;
  context.drawImage(mockup, (size - mockupWidth) / 2, (size - mockupHeight) / 2, mockupWidth, mockupHeight);

  const zoneWidth = size * input.zone.width / 100;
  const zoneHeight = size * input.zone.height / 100;
  const zoneLeft = size * input.zone.left / 100 - zoneWidth / 2;
  const zoneTop = size * input.zone.top / 100 - zoneHeight / 2;
  const containScale = Math.min(zoneWidth / print.naturalWidth, zoneHeight / print.naturalHeight);
  const printWidth = print.naturalWidth * containScale * input.transform.scale;
  const printHeight = print.naturalHeight * containScale * input.transform.scale;
  const positionScale = size / Math.max(input.previewSize, 1);

  context.save();
  context.beginPath();
  context.rect(zoneLeft, zoneTop, zoneWidth, zoneHeight);
  context.clip();
  context.drawImage(
    print,
    zoneLeft + (zoneWidth - printWidth) / 2 + input.transform.x * positionScale,
    zoneTop + (zoneHeight - printHeight) / 2 + input.transform.y * positionScale,
    printWidth,
    printHeight,
  );
  context.restore();

  // Плашка с подписью для исполнителя
  if (input.label) {
    const barH = 72;
    const fontSize = 36;
    const radius = 18;
    const py = size - barH - 24;

    context.font = `bold ${fontSize}px Arial, sans-serif`;
    context.textBaseline = "middle";
    const textW = context.measureText(input.label).width;
    const boxW = textW + 48;
    const boxX = (size - boxW) / 2;

    // Скруглённый прямоугольник с полупрозрачным фоном
    context.beginPath();
    context.moveTo(boxX + radius, py);
    context.lineTo(boxX + boxW - radius, py);
    context.quadraticCurveTo(boxX + boxW, py, boxX + boxW, py + radius);
    context.lineTo(boxX + boxW, py + barH - radius);
    context.quadraticCurveTo(boxX + boxW, py + barH, boxX + boxW - radius, py + barH);
    context.lineTo(boxX + radius, py + barH);
    context.quadraticCurveTo(boxX, py + barH, boxX, py + barH - radius);
    context.lineTo(boxX, py + radius);
    context.quadraticCurveTo(boxX, py, boxX + radius, py);
    context.closePath();
    context.fillStyle = "rgba(0, 0, 0, 0.72)";
    context.fill();

    // Белый текст по центру плашки
    context.fillStyle = "#ffffff";
    context.fillText(input.label, boxX + 24, py + barH / 2);
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Не удалось создать превью")), "image/png", 0.92);
  });
}
