import { IsEmail, MaxLength } from 'class-validator';

export class SendLoginLinkDto {
  @IsEmail()
  @MaxLength(120)
  email!: string;
}
