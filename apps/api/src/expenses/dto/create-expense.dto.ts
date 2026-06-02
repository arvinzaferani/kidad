import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Currency, SplitType } from '../../database/entities';

class ExpensePayerDto {
  @IsUUID('4')
  memberId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number;
}

class ExpenseSplitDto {
  @IsUUID('4')
  memberId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  value!: number;
}

export class CreateExpenseDto {
  @IsString()
  @MaxLength(240)
  description!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number;

  @IsEnum(Currency)
  currency!: Currency;

  @IsEnum(SplitType)
  splitType!: SplitType;

  @IsDateString()
  date!: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ExpensePayerDto)
  payers?: ExpensePayerDto[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ExpenseSplitDto)
  splits?: ExpenseSplitDto[];
}
