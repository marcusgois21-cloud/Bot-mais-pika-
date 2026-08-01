import { Body, Controller, Get, Post, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { Throttle } from '@nestjs/throttler';
import { AuthService, PayloadToken } from './auth.service';

class EntrarDto {
  @IsEmail({}, { message: 'Informe um e-mail válido.' })
  email!: string;

  @IsString()
  @MinLength(6, { message: 'A senha precisa ter ao menos 6 caracteres.' })
  senha!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** Limite apertado: login é o alvo natural de força bruta. */
  @Post('entrar')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  async entrar(@Body() dto: EntrarDto) {
    return this.auth.entrar(dto.email, dto.senha);
  }

  @Get('eu')
  @UseGuards(AuthGuard('jwt'))
  eu(@Request() req: { user: PayloadToken }): PayloadToken {
    return req.user;
  }
}
