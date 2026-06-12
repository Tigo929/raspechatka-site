import type { Category } from "@/types";
import { images } from "./images";

export const categories: Category[] = [
  {
    slug: "s-printom",
    title: "С готовым принтом",
    description:
      "Готовые дизайны для разных поводов — выберите принт и оформите заявку.",
    image: images.catPrint,
    imageAlt: "Футболка с готовым принтом из каталога Распечатка",
  },
  {
    slug: "s-foto",
    title: "С вашим фото",
    description:
      "Перенесём любое фото на ткань с фотографическим качеством и стойкими цветами.",
    image: images.catPhoto,
    imageAlt: "Футболка с фотопечатью на заказ",
  },
  {
    slug: "s-nadpisyu",
    title: "С надписью",
    description:
      "Цитата, имя, дата или мем — соберём типографику и напечатаем за 1 день.",
    image: images.catText,
    imageAlt: "Футболка с индивидуальной надписью",
  },
  {
    slug: "s-logotipom",
    title: "С логотипом",
    description:
      "Корпоративный мерч и брендирование: логотип в фирменных цветах, любой тираж.",
    image: images.catLogo,
    imageAlt: "Футболка с логотипом компании",
  },
];
