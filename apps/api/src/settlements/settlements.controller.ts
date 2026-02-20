import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { SettlementsService } from './settlements.service';
import { CreateSettlementDto } from './dto/create-settlement.dto';
import { UpdateSettlementDto } from './dto/update-settlement.dto';
import { SettlementsQueryDto } from './dto/settlements-query.dto';

@Controller()
export class SettlementsController {
  constructor(
    private readonly settlementsService: SettlementsService,
  ) {}

  @Post('groups/:groupId/settlements/suggest')
  suggestByGroup(@Param('groupId') groupId: string) {
    return this.settlementsService.suggestSettlementsForGroup(groupId);
  }

  @Post('groups/:groupId/settlements')
  create(
    @Param('groupId') groupId: string,
    @Body() body: CreateSettlementDto,
  ) {
    return this.settlementsService.create({ ...body, groupId });
  }

  @Get('groups/:groupId/settlements')
  findByGroup(
    @Param('groupId') groupId: string,
    @Query() query: SettlementsQueryDto,
  ) {
    return this.settlementsService.findByGroup(
      groupId,
      query.page ?? 1,
      query.limit ?? 10,
    );
  }

  @Patch('settlements/:id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateSettlementDto,
  ) {
    return this.settlementsService.update(id, body);
  }
}
