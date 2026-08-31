import { Request } from 'express';
import { RefreshDto } from '../dto/refresh.dto.js';

export interface AuthenticatedRefreshRequest extends Request {
  user: RefreshDto;
}
