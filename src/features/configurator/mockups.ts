export type ShirtColorId = "white" | "black";
export type PrintSide = "front" | "back";

export interface PrintZone {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface ShirtMockupView {
  image: string;
  alt: string;
  zone: PrintZone;
}

export interface ShirtColorOption {
  id: ShirtColorId;
  name: string;
  hex: string;
  hint: string;
  views: Record<PrintSide, ShirtMockupView>;
}

export const sideLabels: Record<PrintSide, string> = {
  front: "Перед",
  back: "Спина",
};

export const sideHints: Record<PrintSide, string> = {
  front: "Классическое размещение на груди",
  back: "Крупный принт на спине",
};

export const shirtColors: ShirtColorOption[] = [
  {
    id: "white",
    name: "Белая",
    hex: "#F4F4F1",
    hint: "Лучше для фото и цветных принтов",
    views: {
      front: {
        image: "/mockups/tshirt-white-front.webp",
        alt: "Белая футболка спереди для конструктора Распечатка",
        zone: { left: 50, top: 48, width: 30, height: 36 },
      },
      back: {
        image: "/mockups/tshirt-white-back.webp",
        alt: "Белая футболка сзади для конструктора Распечатка",
        zone: { left: 50, top: 46, width: 34, height: 42 },
      },
    },
  },
  {
    id: "black",
    name: "Чёрная",
    hex: "#16161A",
    hint: "Контрастно смотрится с яркими и белыми принтами",
    views: {
      front: {
        image: "/mockups/tshirt-black-front.webp",
        alt: "Чёрная футболка спереди для конструктора Распечатка",
        zone: { left: 50, top: 49, width: 30, height: 36 },
      },
      back: {
        image: "/mockups/tshirt-black-back.webp",
        alt: "Чёрная футболка сзади для конструктора Распечатка",
        zone: { left: 50, top: 46, width: 34, height: 42 },
      },
    },
  },
];

export const defaultTransforms: Record<PrintSide, Transform> = {
  front: { x: 0, y: 0, scale: 1 },
  back: { x: 0, y: 0, scale: 1 },
};

export interface Transform {
  x: number;
  y: number;
  scale: number;
}
