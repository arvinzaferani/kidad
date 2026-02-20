import { Controller, Get, Param } from '@nestjs/common';
import { BalancesService } from './balances.service';

@Controller()
export class BalancesController {
  constructor(private readonly balancesService: BalancesService) {}

  @Get('groups/:groupId/balances')
  groupBalances(@Param('groupId') groupId: string) {
    return this.balancesService.getGroupBalancesFromDb(groupId);
  }

  @Get('balances/global')
  globalBalances() {
    return this.balancesService.getGlobalBalancesFromDb();
  }
}
