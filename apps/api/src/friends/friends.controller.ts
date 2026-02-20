import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import { FriendsQueryDto } from './dto/friends-query.dto';
import { CreateFriendRequestDto } from './dto/create-friend-request.dto';
import { RespondFriendRequestDto } from './dto/respond-friend-request.dto';
import { RemoveFriendDto } from './dto/remove-friend.dto';

@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get()
  listFriends(@Query() query: FriendsQueryDto) {
    if (!query.userId) {
      return {
        items: [],
        total: 0,
        page: query.page ?? 1,
        limit: query.limit ?? 10,
        hasNext: false,
      };
    }
    return this.friendsService.listFriends(
      query.userId,
      query.page ?? 1,
      query.limit ?? 10,
    );
  }

  @Get('requests/incoming')
  listIncoming(@Query() query: FriendsQueryDto) {
    if (!query.userId) {
      return {
        items: [],
        total: 0,
        page: query.page ?? 1,
        limit: query.limit ?? 10,
        hasNext: false,
      };
    }
    return this.friendsService.listPendingIncoming(
      query.userId,
      query.page ?? 1,
      query.limit ?? 10,
    );
  }

  @Post('requests')
  createRequest(@Body() body: CreateFriendRequestDto) {
    return this.friendsService.createRequest(body);
  }

  @Post('requests/:requestId/accept')
  acceptRequest(
    @Param('requestId') requestId: string,
    @Body() body: RespondFriendRequestDto,
  ) {
    return this.friendsService.acceptRequest(requestId, body.userId);
  }

  @Post('requests/:requestId/decline')
  declineRequest(
    @Param('requestId') requestId: string,
    @Body() body: RespondFriendRequestDto,
  ) {
    return this.friendsService.declineRequest(requestId, body.userId);
  }

  @Delete(':friendshipId')
  removeFriend(
    @Param('friendshipId') friendshipId: string,
    @Body() body: RemoveFriendDto,
  ) {
    return this.friendsService.removeFriend(friendshipId, body.userId);
  }
}
