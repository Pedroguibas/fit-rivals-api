import { Request } from 'express';
import { PayloadDto } from '../dto/payload.dto.js';

export interface AuthenticatedRequest extends Request {
  user: PayloadDto;
}
