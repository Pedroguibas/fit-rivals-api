import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { GroupsService } from './groups.service.js';
import { CreateGroupDto } from './dto/request/create-group.dto.js';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request.type.js';
import { InviteToGroupDto } from './dto/request/invite-to-group.dto.js';
import { PromoteGroupMembersDto } from './dto/request/promote-group-members.dto.js';
import { UpdateGroupDto } from './dto/request/update-group-.dto.js';

@UseGuards(AuthGuard('jwt'))
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  async getGroups(@Req() req: AuthenticatedRequest) {
    return await this.groupsService.getGroups(req.user.sub);
  }

  @Post()
  async createGroup(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateGroupDto,
  ) {
    return await this.groupsService.createGroup(body, req.user.sub);
  }

  @Get('invites')
  async getInvites(@Req() req: AuthenticatedRequest) {
    return await this.groupsService.getInvites(req.user.sub);
  }

  @Post('invites/:invite_id/accept')
  async acceptInvite(
    @Req() req: AuthenticatedRequest,
    @Param('invite_id') invite_id: string,
  ) {
    return await this.groupsService.acceptInvite(invite_id, req.user.sub);
  }

  @Post('invites/:invite_id/deny')
  async denyInvite(
    @Req() req: AuthenticatedRequest,
    @Param('invite_id') invite_id: string,
  ) {
    return await this.groupsService.denyInvite(invite_id, req.user.sub);
  }

  @Get(':id')
  async getGroupById(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return await this.groupsService.getGroupById(id, req.user.sub);
  }

  @Patch(':id')
  async updateGroup(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateGroupDto,
  ) {
    if (!body || !(body.name || body.picture)) throw new BadRequestException();

    return await this.groupsService.updateGroup(id, req.user.sub, body);
  }

  @Get(':id/members')
  async getGroupMembers(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return await this.groupsService.getGroupMembers(id, req.user.sub);
  }

  @Patch(':id/members/promote')
  async promoteGroupMember(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: PromoteGroupMembersDto,
  ) {
    return await this.groupsService.updateGroupMembersRole(
      id,
      body.members,
      req.user.sub,
      true,
    );
  }

  @Patch(':id/members/demote')
  async demoteGroupMember(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: PromoteGroupMembersDto,
  ) {
    return await this.groupsService.updateGroupMembersRole(
      id,
      body.members,
      req.user.sub,
      false,
    );
  }

  @Get(':id/activities')
  async getGroupActivities(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return await this.groupsService.getGroupActivities(id, req.user.sub);
  }

  @Post(':id/invite')
  async addToGroup(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: InviteToGroupDto,
  ) {
    return await this.groupsService.inviteToGroup(id, body.users, req.user.sub);
  }
}
