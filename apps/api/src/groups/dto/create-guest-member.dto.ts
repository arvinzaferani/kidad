import { IsEmail, IsOptional, IsPhoneNumber, IsString, MaxLength } from 'class-validator';

export class CreateGuestMemberDto {
  @IsString()
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsPhoneNumber('IR')
  phone?: string;
}
