import { IsString, IsUUID, Matches, MaxLength } from 'class-validator';

export class CreateFriendRequestDto {
  @IsUUID('4')
  requesterId!: string;

  @IsString()
  @MaxLength(120)
  @Matches(/^(09\d{9}|[^\s@]+@[^\s@]+\.[^\s@]+)$/)
  identifier!: string;
}
