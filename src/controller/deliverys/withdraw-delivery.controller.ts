import {
  Body,
  Controller,
  HttpCode,
  NotFoundException,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common'
import { CurrentUser } from 'src/auth/current-user-decorator'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'
import { UserPayload } from 'src/auth/jwt.strategy'
import { ZodValidationPipe } from 'src/pipes/zod-validation-pipe'
import { PrismaService } from 'src/prisma/prisma.service'
import { z } from 'zod'
import { NotificationService } from '../notification/notification-service.controller'

const updateWithdrawDeliveryBodySchema = z.object({
  status: z.enum(['RETIRADA']).optional(),
})

const bodyValidationPipe = new ZodValidationPipe(
  updateWithdrawDeliveryBodySchema,
)

type UpdatWeithdrawDeDeliveryBodySchema = z.infer<
  typeof updateWithdrawDeliveryBodySchema
>

@Controller('/delivery/:id/withdrawal')
@UseGuards(JwtAuthGuard)
export class MarkDeliveryWitchDrawController {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  @Put()
  @HttpCode(204)
  async handle(
    @CurrentUser() userLoad: UserPayload,
    @Param('id') id: string,
    @Body(bodyValidationPipe) body: UpdatWeithdrawDeDeliveryBodySchema,
  ) {
    const { status } = body

    const userLogin = await this.prisma.user.findUnique({
      where: { id: userLoad.sub },
    })

    if (userLogin?.role !== 'ENTREGADOR') {
      throw new NotFoundException('Usuário não é um entregador do sistema')
    }

    const delivery = await this.prisma.delivery.findUnique({
      where: { id },
      include: { recipient: true },
    })

    if (!delivery) {
      throw new NotFoundException('Entrega não encontrada')
    }

    const deliveryToCheck = await this.prisma.delivery.findUnique({
      where: { id },
    })

    if (deliveryToCheck?.status !== 'AGUARDANDO') {
      throw new NotFoundException(
        'Esse pedido ainda não esta pronto, ou já foi retirado',
      )
    }

    await this.prisma.delivery.update({
      where: { id },
      data: {
        deliverymanId: userLogin?.id,
        status,
      },
    })

    // Notifica o destinatário
    await this.notificationService.notifyRecipient(
      id,
      delivery.recipientId,
      `Sua encomenda esta a caminho!`,
    )
  }
}
