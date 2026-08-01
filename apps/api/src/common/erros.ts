import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Erro de domínio: algo que o usuário pode corrigir, e cuja mensagem pode
 * ser mostrada. Distinto de falha técnica, que nunca vaza detalhe ao cliente.
 */
export class ErroDeDominio extends Error {
  constructor(
    message: string,
    readonly status: number = HttpStatus.BAD_REQUEST,
    readonly codigo?: string,
  ) {
    super(message);
    this.name = 'ErroDeDominio';
  }
}

@Catch()
export class FiltroDeExcecoes implements ExceptionFilter {
  private readonly logger = new Logger('Erro');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let mensagem = 'Erro interno. Tente novamente em instantes.';
    let codigo: string | undefined;

    if (exception instanceof ErroDeDominio) {
      status = exception.status;
      mensagem = exception.message;
      codigo = exception.codigo;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const corpo = exception.getResponse();
      mensagem =
        typeof corpo === 'string'
          ? corpo
          : ((corpo as Record<string, unknown>).message as string) ?? exception.message;
    }

    // Falha técnica (5xx) vai completa para o log, resumida para o cliente.
    // Vazar stack trace numa API pública é entregar o mapa da casa.
    if (status >= 500) {
      this.logger.error(
        `${req.method} ${req.url} → ${status}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else {
      this.logger.warn(`${req.method} ${req.url} → ${status}: ${mensagem}`);
    }

    res.status(status).json({
      erro: mensagem,
      codigo,
      caminho: req.url,
      em: new Date().toISOString(),
    });
  }
}
