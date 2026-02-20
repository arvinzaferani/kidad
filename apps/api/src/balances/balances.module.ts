import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BalancesController } from './balances.controller';
import { BalancesService } from './balances.service';
import { Expense } from '../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Expense])],
  controllers: [BalancesController],
  providers: [BalancesService],
})
export class BalancesModule {}
