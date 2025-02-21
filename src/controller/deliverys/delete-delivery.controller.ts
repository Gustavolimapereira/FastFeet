import {
  Controller,
  Delete,
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
export class DeleteDeliveryController {
  constructor(private prisma: PrismaService) {}

  @Delete()
  @HttpCode(204)
  async handle(@CurrentUser() userLoad: UserPayload, @Param('id') id: string) {
    const userLogin = await this.prisma.user.findUnique({
      where: { id: userLoad.sub },
    })

    if (userLogin?.role !== 'ADMIN') {
      throw new NotFoundException('Usuário não é um admin do sistema')
    }

    const user = await this.prisma.delivery.findUnique({
      where: { id },
    })

    if (!user) {
      throw new NotFoundException('Pedido não encontrado')
    }

    await this.prisma.delivery.delete({
      where: { id },
    })
  }
}
