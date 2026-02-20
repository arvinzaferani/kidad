import { IsUUID } from 'class-validator';

export class AddFriendToGroupDto {
  @IsUUID('4')
  actorId!: string;

  @IsUUID('4')
  friendId!: string;
}
