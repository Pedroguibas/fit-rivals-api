import { Module } from '@nestjs/common';
import { ImagesController } from './images.controller.js';
import { ImagesService } from './images.service.js';
import { R2Module } from '../r2/r2.module.js';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [R2Module, ConfigModule],
  controllers: [ImagesController],
  providers: [ImagesService],
})
export class ImagesModule {}
