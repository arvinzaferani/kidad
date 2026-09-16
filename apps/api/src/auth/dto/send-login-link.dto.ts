import { IsEmail, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class SendLoginLinkDto {
  @IsEmail()
  @MaxLength(120)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Matches(/^\/(?!\/)/, {
    message: 'next must be a relative path',
  })
  next?: string;
}