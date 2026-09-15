import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSplitSessionDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  title?: string;
}