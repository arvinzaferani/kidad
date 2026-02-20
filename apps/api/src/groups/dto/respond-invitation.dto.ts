import { IsUUID } from 'class-validator';

export class RespondInvitationDto {
  @IsUUID('4')
  userId!: string;
}
