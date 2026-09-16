import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class JoinSplitAsGuestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  nickname!: string;

  @IsEmail()
  email!: string;
}