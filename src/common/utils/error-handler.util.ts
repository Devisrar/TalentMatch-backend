import { Logger, ConflictException, InternalServerErrorException } from '@nestjs/common';

export function handleDatabaseError(error: any, context: string): never {
  const logger = new Logger(context);
  
  if (error.code === '23505') {
    logger.warn('Duplicate entry detected');
    throw new ConflictException('The resource already exists.');
  }
  
  logger.error('Unexpected database error', error.stack);
  throw new InternalServerErrorException('An internal server error occurred');
}
