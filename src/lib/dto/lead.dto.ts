import "reflect-metadata";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  Equals,
  MaxLength,
  MinLength,
  Matches,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { ContactDto } from "@/lib/dto/order.dto";

export class LeadDto {
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
  @IsString()
  @MaxLength(1000, { message: "Комментарий слишком длинный" })
  comment?: string;

  /** Honeypot — должно быть пустым */
  @IsOptional()
  @IsString()
  website?: string;

  @IsBoolean()
  @Equals(true, { message: "Необходимо согласие на обработку персональных данных" })
  personalDataConsent!: true;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  consentAcceptedAt?: string;
}
