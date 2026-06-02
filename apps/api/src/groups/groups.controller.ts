import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { CreateInvitationDto } from './dto/create-invitation.dto';
import { GroupMemberActionDto } from './dto/group-member-action.dto';
import { RespondInvitationDto } from './dto/respond-invitation.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
import { GroupsQueryDto } from './dto/groups-query.dto';
import { AddFriendToGroupDto } from './dto/add-friend-to-group.dto';
import { CreateGuestMemberDto } from './dto/create-guest-member.dto';

@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  findAll(@Query() query: GroupsQueryDto) {
    return this.groupsService.findAll(
      query.userId,
      query.page ?? 1,
      query.limit ?? 10,
    );
  }

  @Post()
  create(@Body() body: CreateGroupDto) {
    return this.groupsService.create(body);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Query() query: GroupsQueryDto,
  ) {
    return this.groupsService.findOne(id, query.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: UpdateGroupDto,
  ) {
    return this.groupsService.update(id, body);
  }

  @Post(':id/invite')
  invite(
    @Param('id') id: string,
    @Body() body: CreateInvitationDto,
  ) {
    return this.groupsService.invite(id, body);
  }

  @Post(':id/guest-members')
  addGuestMember(
    @Param('id') id: string,
    @Body() body: CreateGuestMemberDto,
  ) {
    return this.groupsService.addGuestMember(id, body);
  }

  @Post(':id/invitations/:invitationId/accept')
  acceptInvitation(
    @Param('id') id: string,
    @Param('invitationId') invitationId: string,
    @Body() body: RespondInvitationDto,
  ) {
    return this.groupsService.acceptInvitation(id, invitationId, body.userId);
  }

  @Post(':id/invitations/:invitationId/decline')
  declineInvitation(
    @Param('id') id: string,
    @Param('invitationId') invitationId: string,
    @Body() body: RespondInvitationDto,
  ) {
    return this.groupsService.declineInvitation(id, invitationId, body.userId);
  }

  @Post(':id/join')
  join(
    @Param('id') id: string,
    @Body() body: GroupMemberActionDto,
  ) {
    return this.groupsService.join(id, body.userId);
  }

  @Post(':id/leave')
  leave(
    @Param('id') id: string,
    @Body() body: GroupMemberActionDto,
  ) {
    return this.groupsService.leave(id, body.userId);
  }

  @Post(':id/friends/add')
  addFriendToGroup(
    @Param('id') id: string,
    @Body() body: AddFriendToGroupDto,
  ) {
    return this.groupsService.addFriendToGroup(id, body.actorId, body.friendId);
  }
}
