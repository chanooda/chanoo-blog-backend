import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { SignInDto } from './dto/signIn.dto';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async signIn(signInDto: SignInDto) {
    const masterUsername = process.env.MASTER_ID;
    const masterPassword = process.env.MASTER_PW;

    const { password, username } = signInDto;

    if (username !== masterUsername || password !== masterPassword) {
      throw new UnauthorizedException();
    }

    const payload = { username };

    return {
      data: {
        accessToken: await this.jwtService.signAsync(payload),
      },
    };
  }
}
