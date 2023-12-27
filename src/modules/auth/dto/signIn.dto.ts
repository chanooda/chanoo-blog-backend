import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SignInDto {
  @ApiProperty({
    description: '마스터 ID',
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    description: '마스터 비밀번호',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
