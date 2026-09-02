import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { PayloadDto } from '../../modules/auth/dto/payload.dto.js';

@Injectable()
export class AdminGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const user: PayloadDto = req.user;

    if (user.role !== 'ADMIN') throw new UnauthorizedException();

    return true;
  }
}
