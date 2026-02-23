import { IsString, IsUUID, Length, MaxLength, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsUUID('4')
  userId!: string;

  @IsString()
  @Length(32, 256)
  token!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;
}
