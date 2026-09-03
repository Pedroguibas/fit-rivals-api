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

  @Delete(':id')
  async removeFriend(
    @Req() req: AuthenticatedRequest,
    @Param('id', new ParseUUIDPipe()) id: string,
  ) {
    return await this.friendsService.removeFriend(id, req.user.sub);
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
}
