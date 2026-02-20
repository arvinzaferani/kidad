import { IsOptional, IsString, IsUUID, Matches, MaxLength } from 'class-validator';

export class CreateInvitationDto {
  @IsUUID('4')
  inviterId!: string;

  @IsString()
  @MaxLength(120)
  @Matches(/^(09\d{9}|[^\s@]+@[^\s@]+\.[^\s@]+)$/)
  identifier!: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  note?: string;
}
