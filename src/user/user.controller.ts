import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { UserUsecase } from './usecases/User.usecase';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { toUserResponse } from './dto/user-response.dto';
import { IsPublic } from 'src/@shared/decorators/ispublic.decorator';

@Controller('users')
export class UserController {
  constructor(private readonly userUsecase: UserUsecase) {}

  @IsPublic()
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.userUsecase.execute(createUserDto);
    return toUserResponse(user);
  }

  @Get('me')
  async getMe(@Req() req: Request) {
    const userId = (req as Request & { user?: { id: number } }).user?.id;
    if (userId == null) {
      throw new UnauthorizedException('User not authenticated');
    }
    const user = await this.userUsecase.findById(userId);
    return toUserResponse(user);
  }

  @Get()
  async findAll() {
    const users = await this.userUsecase.findAll();
    return users.map(toUserResponse);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const user = await this.userUsecase.findById(+id);
    return toUserResponse(user);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    const user = await this.userUsecase.update(+id, updateUserDto);
    return user ? toUserResponse(user) : null;
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userUsecase.delete(+id);
  }
}
