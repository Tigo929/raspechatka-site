import "reflect-metadata";
import {
  IsString, IsNotEmpty, IsOptional, IsIn,
  IsInt, Min, Max, MaxLength, Matches,
} from "class-validator";

export class AnalyticsDto {
  @IsIn(["pageview", "session_end"], { message: "Неизвестный тип события" })
  type!: "pageview" | "session_end";

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Matches(/^\//, { message: "page должен начинаться с /" })
  page!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @Matches(/^[a-zA-Z0-9_-]+$/, { message: "Некорректный sessionId" })
  sessionId!: string;

  @IsIn(["mobile", "desktop", "tablet"], { message: "Неизвестный тип устройства" })
  device!: "mobile" | "desktop" | "tablet";

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(7200)
  duration?: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  referrer?: string;
}
