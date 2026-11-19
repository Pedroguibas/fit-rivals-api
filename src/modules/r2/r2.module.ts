import { Module } from '@nestjs/common';
import { R2Provider } from './r2.provider.js';

@Module({
  providers: [R2Provider],
  exports: [R2Provider],
})
export class R2Module {}
