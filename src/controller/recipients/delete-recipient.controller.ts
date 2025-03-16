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

@Controller('/recipients/:id')
@UseGuards(JwtAuthGuard)
export class DeleteRecipientController {
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

    const user = await this.prisma.recipient.findUnique({
      where: { id },
    })

    const delivery = await this.prisma.delivery.findMany({
      where: { recipientId: id },
    })

    if (!user) {
      throw new NotFoundException('Usuário não encontrado')
    }

    if (delivery.length > 0) {
      throw new NotFoundException(
        'Usuário não pode ser deletado pois tem encomendas associadas',
      )
    }

    await this.prisma.recipient.delete({
      where: { id },
    })

    return {
      user,
    }

    /*
    
*/
  }
}
