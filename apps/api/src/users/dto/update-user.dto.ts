import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

const normalizeCardNumber = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.replace(/[\s-]/g, '') : value;

const normalizeShaba = ({ value }: { value: unknown }) =>
  typeof value === 'string'
    ? value.replace(/[\s-]/g, '').toUpperCase()
    : value;

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(40)
  nickname?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000000)
  avatarUrl?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  email?: string;

  @IsOptional()
  @IsString()
  @Matches(/^09\d{9}$/)
  phone?: string;

  @IsOptional()
  @IsString()
  @Transform(normalizeCardNumber)
  @ValidateIf((_obj, value) => value !== '')
  @Matches(/^\d{16}$/, { message: 'شماره کارت باید ۱۶ رقم باشد.' })
  cardNumber?: string;

  @IsOptional()
  @IsString()
  @Transform(normalizeShaba)
  @ValidateIf((_obj, value) => value !== '')
  @Matches(/^IR\d{24}$/, { message: 'شماره شبا باید با IR و ۲۴ رقم باشد.' })
  shaba?: string;
}
