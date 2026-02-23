import { IsString, IsUUID, Length } from 'class-validator';

export class LoginWithLinkDto {
  @IsUUID('4')
  userId!: string;

  @IsString()
  @Length(32, 256)
  token!: string;
}
