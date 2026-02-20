import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Min } from 'class-validator';
import { SettlementMethod, SettlementStatus } from '../../database/entities';

export class UpdateSettlementDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsEnum(SettlementMethod)
  method?: SettlementMethod;

  @IsOptional()
  @IsEnum(SettlementStatus)
  status?: SettlementStatus;
}
