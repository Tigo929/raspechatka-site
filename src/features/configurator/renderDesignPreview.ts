import type { PrintZone, Transform } from "@/features/configurator/mockups";

export interface DesignPreviewInput {
  mockupUrl: string;
  imageUrl: string;
  zone: PrintZone;
  transform: Transform;
  previewSize: number;
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

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Не удалось создать превью")), "image/png", 0.92);
  });
}
