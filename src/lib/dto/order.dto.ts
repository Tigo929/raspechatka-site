import "reflect-metadata";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsBoolean,
  MaxLength,
  MinLength,
  ValidateNested,
  Matches,
  IsObject,
} from "class-validator";
import { Type } from "class-transformer";

export class ContactDto {
  @IsIn(["telegram", "max", "phone"], {
    message: "Способ связи: telegram, max или phone",
  })
  method!: "telegram" | "max" | "phone";

  @IsString()
  @IsNotEmpty({ message: "Укажите контактные данные" })
  @MaxLength(80, { message: "Контакт слишком длинный" })
  value!: string;
}

export class OrderDetailsDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  productName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  size?: string;

  @IsOptional()
  @IsObject()
  prints?: Record<string, string | null>;
}

export class OrderDto {
  @IsString({ message: "Имя должно быть строкой" })
  @IsNotEmpty({ message: "Укажите ваше имя" })
  @MinLength(2, { message: "Имя слишком короткое" })
  @MaxLength(80, { message: "Имя слишком длинное" })
  @Matches(/^[\p{L}\s'\-]+$/u, { message: "Имя содержит недопустимые символы" })
  name!: string;

  @ValidateNested()
  @Type(() => ContactDto)
  contact!: ContactDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => OrderDetailsDto)
  orderDetails?: OrderDetailsDto;

  /** Honeypot — должно быть пустым */
  @IsOptional()
  @IsString()
  website?: string;

  /** Факт согласия на обработку персональных данных */
  @IsOptional()
  @IsBoolean()
  personalDataConsent?: boolean;

  /** Факт подтверждения прав на загружаемое изображение */
  @IsOptional()
  @IsBoolean()
  imageRightsConsent?: boolean;

  /** ISO-дата момента согласия */
  @IsOptional()
  @IsString()
  @MaxLength(30)
  consentAcceptedAt?: string;
}
