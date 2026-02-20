import { IsUUID } from 'class-validator';

export class RespondFriendRequestDto {
  @IsUUID('4')
  userId!: string;
}
