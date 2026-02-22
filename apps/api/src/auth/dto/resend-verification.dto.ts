import { IsEmail, MaxLength } from 'class-validator';

export class ResendVerificationDto {
  @IsEmail()
  @MaxLength(120)
  email!: string;
}
