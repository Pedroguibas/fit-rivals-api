import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { GetSignedUrlRequest } from './dto/request/getSignedUrlRequest.dto.js';
import { ImagesService } from './images.service.js';

@UseGuards(AuthGuard('jwt'))
@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post()
  async getSignedRoute(@Body() body: GetSignedUrlRequest) {
    return this.imagesService.getSignedRoute(body.contentType);
  }
}
