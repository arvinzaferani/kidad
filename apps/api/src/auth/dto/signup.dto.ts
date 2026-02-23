import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class SignupDto {
  @IsEmail()
  @MaxLength(120)
  email!: string;

  @IsOptional()
  @IsString()
  @Matches(/^09\d{9}$/)
  phone?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  nickname?: string;
}
