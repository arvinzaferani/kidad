import { Body, Controller, Get, Headers, Param, Patch, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminListQueryDto } from './dto/admin-list-query.dto';
import { UpdateAdminUserDto } from './dto/update-admin-user.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  stats(@Headers('authorization') authorization?: string) {
    return this.adminService.getStats(authorization);
  }

  @Get('users')
  users(
    @Headers('authorization') authorization: string | undefined,
    @Query() query: AdminListQueryDto,
  ) {
    return this.adminService.getUsers(authorization, query);
  }

  @Get('groups')
  groups(
    @Headers('authorization') authorization: string | undefined,
    @Query() query: AdminListQueryDto,
  ) {
    return this.adminService.getGroups(authorization, query);
  }

  @Get('groups/:id')
  group(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    return this.adminService.getGroup(authorization, id);
  }

  @Patch('users/:id/admin')
  setAdmin(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: UpdateAdminUserDto,
  ) {
    return this.adminService.setAdmin(authorization, id, body.value);
  }

  @Patch('users/:id/ban')
  setBanned(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: UpdateAdminUserDto,
  ) {
    return this.adminService.setBanned(authorization, id, body.value);
  }
}
