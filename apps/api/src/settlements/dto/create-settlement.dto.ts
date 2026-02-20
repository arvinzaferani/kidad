import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';
import { SettlementMethod, SettlementStatus } from '../../database/entities';

export class CreateSettlementDto {
  @IsUUID('4')
  payerId!: string;

  @IsUUID('4')
  receiverId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount!: number;

  @IsEnum(SettlementMethod)
  method!: SettlementMethod;

  @IsOptional()
  @IsEnum(SettlementStatus)
  status?: SettlementStatus;
}
