import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

/** Защита админ-эндпоинтов: Authorization: Bearer <JWT>. */
@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {}
