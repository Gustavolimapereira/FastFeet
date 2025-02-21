import {
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common'
import { CurrentUser } from 'src/auth/current-user-decorator'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'
import { UserPayload } from 'src/auth/jwt.strategy'
import { PrismaService } from 'src/prisma/prisma.service'

@Controller('/recipients/:id')
@UseGuards(JwtAuthGuard)
export class ListRecipientController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @HttpCode(200)
  async handle(@CurrentUser() userLoad: UserPayload, @Param('id') id: string) {
    const userLogin = await this.prisma.user.findUnique({
      where: { id: userLoad.sub },
    })

    if (userLogin?.role !== 'ADMIN') {
      throw new NotFoundException('Usuário não é um admin do sistema')
    }

    const user = await this.prisma.recipient.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        address: true,
        latitude: true,
        longitude: true,
      },
    })

    if (!user) {
      throw new NotFoundException('Usuário não encontrado')
    }

    return {
      user,
    }
  }
}
