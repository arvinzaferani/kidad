import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import {
  Expense,
  Group,
  GroupMember,
  Settlement,
  User,
} from '../database/entities';

@Module({
  imports: [TypeOrmModule.forFeature([User, Group, GroupMember, Expense, Settlement])],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
