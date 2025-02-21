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

const updateWaitingDeliveryBodySchema = z.object({
  status: z.enum(['AGUARDANDO']).optional(),
})

const bodyValidationPipe = new ZodValidationPipe(
  updateWaitingDeliveryBodySchema,
)

type UpdateWaitingDeDeliveryBodySchema = z.infer<
  typeof updateWaitingDeliveryBodySchema
>

@Controller('/delivery/:id/available')
@UseGuards(JwtAuthGuard)
export class MarkDeliveryAvailableController {
  constructor(private prisma: PrismaService) {}

  @Put()
  @HttpCode(204)
  async handle(
    @CurrentUser() userLoad: UserPayload,
    @Param('id') id: string,
    @Body(bodyValidationPipe) body: UpdateWaitingDeDeliveryBodySchema,
  ) {
    const { status } = body

    const delivery = await this.prisma.delivery.findUnique({
      where: { id },
    })

    if (!delivery) {
      throw new NotFoundException('Entrega não encontrada')
    }

    const userLogin = await this.prisma.user.findUnique({
      where: { id: userLoad.sub },
    })

    if (userLogin?.role !== 'ADMIN') {
      throw new NotFoundException('Usuário não é um admin do sistema')
    }

    const deliveryToCheck = await this.prisma.delivery.findUnique({
      where: { id },
    })

    if (deliveryToCheck?.status === 'AGUARDANDO') {
      throw new NotFoundException(
        'Esse pedido já esta marcado como AGUARDANDO ',
      )
    }

    await this.prisma.delivery.update({
      where: { id },
      data: {
        status,
      },
    })
  }
}
