import { Controller, Get, HttpCode, UseGuards } from '@nestjs/common'
import { CurrentUser } from 'src/auth/current-user-decorator'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'
import { UserPayload } from 'src/auth/jwt.strategy'
import { PrismaService } from 'src/prisma/prisma.service'

@Controller('/deliverylist/user/')
@UseGuards(JwtAuthGuard)
export class ListDeliveryByUserController {
  constructor(private prisma: PrismaService) {}

  @Get()
  @HttpCode(200)
  async handle(@CurrentUser() userLoad: UserPayload) {
    const userLogin = await this.prisma.user.findUnique({
      where: { id: userLoad.sub },
    })

    if (!userLogin) {
      throw new Error('Usuário não encontrado')
    }

    const deliivery = await this.prisma.delivery.findMany({
      where: { deliverymanId: userLogin.id },
      select: {
        id: true,
        recipientId: true,
        adminId: true,
        deliverymanId: true,
        status: true,
        photoUrl: true,
      },
    })

    return {
      deliivery,
    }
  }
}
