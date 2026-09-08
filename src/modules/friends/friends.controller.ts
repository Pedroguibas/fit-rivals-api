import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FriendsService } from './friends.service.js';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request.type.js';
import { CreateFriendRequestDto } from './dto/request/create-friend-request.dto.js';

@UseGuards(AuthGuard('jwt'))
@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get()
  async getFriends(@Req() req: AuthenticatedRequest) {
    return await this.friendsService.getFriends(req.user.sub);
  }
  @Get('requests')
  async getFriendRequests(@Req() req: AuthenticatedRequest) {
    return await this.friendsService.getFriendRequests(req.user.sub);
  }

  @Post('requests')
  async createFriendRequest(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateFriendRequestDto,
  ) {
    return await this.friendsService.createFriendRequest(
      req.user.sub,
      body.user,
    );
  }

  @Post('requests/:id/accept')
  async acceptFriendRequest(
    @Req() req: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return await this.friendsService.acceptFriendRequest(id, req.user.sub);
  }

  @Post('requests/:id/deny')
  async denyFriendRequest(
    @Req() req: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return await this.friendsService.denyFriendRequest(id, req.user.sub);
  }

  @Delete(':id')
  async removeFriend(
    @Req() req: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return await this.friendsService.removeFriend(id, req.user.sub);
  }
}
