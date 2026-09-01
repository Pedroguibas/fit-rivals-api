import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { GroupsService } from './groups.service.js';
import { CreateGroupDto } from './dto/request/create-group.dto.js';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request.type.js';
import { InviteToGroupDto } from './dto/request/invite-to-group.dto.js';

@UseGuards(AuthGuard('jwt'))
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  async getGroups(@Req() req: AuthenticatedRequest) {
    return await this.groupsService.getGroups(req.user);
  }

  @Get(':id')
  async getGroupById(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return await this.groupsService.getGroupById(id, req.user);
  }

  @Get(':id/members')
  async getGroupMembers(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return await this.groupsService.getGroupMembers(id, req.user);
  }

  @Post()
  async createGroup(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateGroupDto,
  ) {
    return await this.groupsService.createGroup(body, req.user);
  }

  @Post(':id/invite')
  async addToGroup(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: InviteToGroupDto,
  ) {
    return await this.groupsService.inviteToGroup(id, body.users, req.user);
  }

  @Post('invites/:invite_id/accept')
  async acceptInvite(
    @Req() req: AuthenticatedRequest,
    @Param('invite_id') invite_id: string,
  ) {
    return await this.groupsService.acceptInvite(invite_id, req.user);
  }

  @Post('invites/:invite_id/deny')
  async denyInvite(
    @Req() req: AuthenticatedRequest,
    @Param('invite_id') invite_id: string,
  ) {
    return await this.groupsService.denyInvite(invite_id, req.user);
  }
}
