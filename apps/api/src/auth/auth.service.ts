import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { DatabaseService } from '../database/database.service';

export interface PayloadToken {
  sub: string; // usuario_id
  empresaId: string;
  perfil: string;
  nome: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwt: JwtService,
  ) {}

  async entrar(email: string, senha: string): Promise<{ token: string; usuario: PayloadToken }> {
    const usuario = await this.db
      .query<{
        id: string;
        empresa_id: string;
        nome: string;
        perfil: string;
        senha_hash: string | null;
      }>(
        `SELECT u.id, u.empresa_id, u.nome, u.perfil, u.senha_hash
           FROM usuarios u JOIN empresas e ON e.id = u.empresa_id
          WHERE lower(u.email) = lower($1) AND u.ativo AND e.ativa`,
        [email],
      )
      .then((r) => r[0]);

    // Mensagem única para email inexistente e senha errada: distinguir os dois
    // casos entrega ao atacante a lista de emails válidos.
    const generico = new UnauthorizedException('E-mail ou senha inválidos.');
    if (!usuario?.senha_hash) {
      // Compara mesmo sem usuário para não vazar a existência da conta por timing.
      await bcrypt.compare(senha, '$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinv');
      throw generico;
    }

    const confere = await bcrypt.compare(senha, usuario.senha_hash);
    if (!confere) throw generico;

    const payload: PayloadToken = {
      sub: usuario.id,
      empresaId: usuario.empresa_id,
      perfil: usuario.perfil,
      nome: usuario.nome,
    };

    return { token: await this.jwt.signAsync(payload), usuario: payload };
  }

  static async gerarHash(senha: string): Promise<string> {
    return bcrypt.hash(senha, 10);
  }
}
