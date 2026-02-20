import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class GroupMemberActionDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID('4')
  userId!: string;
}
