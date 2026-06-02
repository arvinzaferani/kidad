import { IsBoolean } from 'class-validator';

export class UpdateAdminUserDto {
  @IsBoolean()
  value!: boolean;
}
