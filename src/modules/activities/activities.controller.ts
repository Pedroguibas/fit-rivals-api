import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service.js';
import { AuthGuard } from '@nestjs/passport';
import type { AuthenticatedRequest } from '../auth/types/authenticated-request.type.js';
import { CreateActivityDto } from './dto/request/create-activity.dto.js';
import { AdminGuard } from '../../guards/admin/admin.guard.js';
import { CreateActivityTypeDto } from './dto/request/create-activity-type.dto.js';
import { ReactToActivityDto } from './dto/request/react-to-activity.dto.js';

@UseGuards(AuthGuard('jwt'))
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  async getActivities(@Req() req: AuthenticatedRequest) {
    return await this.activitiesService.getActivities(req.user.sub);
  }

  @Get(':id')
  async getActivityById(@Param('id') id: string) {
    return await this.activitiesService.getActivityById(id);
  }

  @Post()
  async createActivity(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateActivityDto,
  ) {
    return await this.activitiesService.createActivity(body, req.user);
  }

  @UseGuards(AdminGuard)
  @Post('types')
  async createActivityType(@Body() body: CreateActivityTypeDto) {
    return await this.activitiesService.createActivityType(body);
  }

  @Post(':id/reactions')
  async reactToActivity(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: ReactToActivityDto,
  ) {
    return await this.activitiesService.reactToActivity(
      body.reactionType,
      id,
      req.user.sub,
    );
  }
}
