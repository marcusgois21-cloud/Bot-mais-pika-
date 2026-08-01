import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { loadEnv } from '../config/env';
import { PayloadToken } from './auth.service';

/**
 * O payload validado vira `request.user`. O `empresaId` que sai daqui é o que
 * alimenta o `SET app.empresa_id` na camada de banco — ou seja, o tenant vem
 * do token assinado, nunca de um parâmetro que o cliente possa escolher.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: loadEnv().JWT_SECRET,
    });
  }

  validate(payload: PayloadToken): PayloadToken {
    return payload;
  }
}
