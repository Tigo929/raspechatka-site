import "reflect-metadata";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  MaxLength,
  MinLength,
  Matches,
} from "class-validator";

export class LeadDto {
  @IsString({ message: "Имя должно быть строкой" })
  @IsNotEmpty({ message: "Укажите ваше имя" })
  @MinLength(2, { message: "Имя слишком короткое" })
  @MaxLength(80, { message: "Имя слишком длинное" })
  @Matches(/^[\p{L}\s'\-]+$/u, { message: "Имя содержит недопустимые символы" })
  name!: string;

  @IsString({ message: "Телефон должен быть строкой" })
  @IsNotEmpty({ message: "Укажите номер телефона" })
  @MinLength(6, { message: "Телефон слишком короткий" })
  @MaxLength(40, { message: "Телефон слишком длинный" })
  @Matches(/^[\d\s\+\(\)\-]+$/, { message: "Некорректный формат телефона" })
  phone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: "Комментарий слишком длинный" })
  comment?: string;

  /** Honeypot — должно быть пустым */
  @IsOptional()
  @IsString()
  website?: string;

  @IsOptional()
  @IsBoolean()
  personalDataConsent?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  consentAcceptedAt?: string;
}
