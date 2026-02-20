import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ExpensesQueryDto } from './dto/expenses-query.dto';

@Controller()
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post('groups/:groupId/expenses')
  create(
    @Param('groupId') groupId: string,
    @Body() body: CreateExpenseDto,
  ) {
    return this.expensesService.create(groupId, body);
  }

  @Get('groups/:groupId/expenses')
  findByGroup(
    @Param('groupId') groupId: string,
    @Query() query: ExpensesQueryDto,
  ) {
    return this.expensesService.findByGroup(
      groupId,
      query.page ?? 1,
      query.limit ?? 10,
    );
  }

  @Get('expenses/:id')
  findOne(@Param('id') id: string) {
    return this.expensesService.findOne(id);
  }

  @Patch('expenses/:id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateExpenseDto,
  ) {
    return this.expensesService.update(id, body);
  }

  @Delete('expenses/:id')
  remove(@Param('id') id: string) {
    return this.expensesService.remove(id);
  }
}
