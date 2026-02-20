import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { Currency } from '../../database/entities';

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
  @IsUrl()
  @MaxLength(1024)
  imageUrl?: string;

  @IsOptional()
  @IsUUID('4')
  creatorId?: string;
}
