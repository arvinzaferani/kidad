import { UnauthorizedException } from '@nestjs/common';

export function parseRequestUserId(authorization?: string): string {
  const token = authorization?.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    throw new UnauthorizedException('Missing bearer token');
  }
  if (!token.startsWith('dev-')) {
    throw new UnauthorizedException('Invalid token');
  }
  return token.slice(4);
}