import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { Currency, GroupMemberMode } from '../../database/entities';

export class CreateGroupDto {
  @IsString()
  @MaxLength(80)
  name!: string;

  @IsOptional()
  @IsEnum(Currency)
  currency?: Currency;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(750000)
  imageUrl?: string;

  @IsOptional()
  @IsEnum(GroupMemberMode)
  memberMode?: GroupMemberMode;

  @IsOptional()
  @IsUUID('4')
  creatorId?: string;
}
