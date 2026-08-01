import { Injectable, Logger } from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { loadEnv } from '../config/env';

/**
 * Armazenamento de mídia (áudio, foto, PDF).
 *
 * Driver local para desenvolvimento; S3 em produção. A interface é a mesma,
 * então nenhum serviço de domínio sabe onde o arquivo mora de fato.
 */
@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  async salvar(
    buffer: Buffer,
    opcoes: { empresaId: string; tipo: 'audio' | 'foto' | 'documento' | 'pdf'; extensao: string },
  ): Promise<{ url: string; hash: string }> {
    const env = loadEnv();

    // Hash do conteúdo permite detectar duplicata: a mesma foto reenviada não
    // vira dois registros no álbum da obra.
    const hash = createHash('sha256').update(buffer).digest('hex');

    const agora = new Date();
    const caminho = [
      opcoes.empresaId,
      opcoes.tipo,
      String(agora.getUTCFullYear()),
      String(agora.getUTCMonth() + 1).padStart(2, '0'),
      `${randomUUID()}.${opcoes.extensao}`,
    ].join('/');

    if (env.STORAGE_DRIVER === 's3') {
      return { url: await this.salvarNoS3(caminho, buffer), hash };
    }

    const destino = join(env.STORAGE_LOCAL_PATH, caminho);
    await mkdir(dirname(destino), { recursive: true });
    await writeFile(destino, buffer);
    this.logger.debug(`Mídia salva em ${destino}`);

    return { url: `/media/${caminho}`, hash };
  }

  private async salvarNoS3(caminho: string, buffer: Buffer): Promise<string> {
    const env = loadEnv();

    // O SDK da AWS é dependência opcional: quem roda local com STORAGE_DRIVER=local
    // não precisa baixar 20 MB de pacote nem configurar credencial. O nome do
    // módulo vai numa variável de propósito, para o TypeScript não exigir os
    // tipos de um pacote que pode não estar instalado.
    const modulo = '@aws-sdk/client-s3';
    const aws = (await import(modulo).catch(() => null)) as {
      S3Client: new (cfg: { region: string }) => { send: (cmd: unknown) => Promise<unknown> };
      PutObjectCommand: new (input: Record<string, unknown>) => unknown;
    } | null;

    if (!aws) {
      throw new Error(
        'STORAGE_DRIVER=s3 exige o pacote @aws-sdk/client-s3. Instale com: npm i @aws-sdk/client-s3',
      );
    }

    const cliente = new aws.S3Client({ region: env.S3_REGION });
    await cliente.send(
      new aws.PutObjectCommand({ Bucket: env.S3_BUCKET, Key: caminho, Body: buffer }),
    );
    return `s3://${env.S3_BUCKET}/${caminho}`;
  }
}
