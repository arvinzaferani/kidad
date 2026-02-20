import { IsUUID } from 'class-validator';

export class RemoveFriendDto {
  @IsUUID('4')
  userId!: string;
}
