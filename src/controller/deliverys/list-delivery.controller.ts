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

@Controller('/delivery/:id')
@UseGuards(JwtAuthGuard)
export class ListDeliveryController {
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

    const deliivery = await this.prisma.delivery.findUnique({
      where: { id },
      select: {
        id: true,
        recipientId: true,
        adminId: true,
        deliverymanId: true,
        status: true,
        photoUrl: true,
      },
    })

    if (!deliivery) {
      throw new NotFoundException('Usuário não encontrado')
    }

    return {
      deliivery,
    }
  }
}
