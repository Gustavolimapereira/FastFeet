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

const updateReturnedDeliveryBodySchema = z.object({
  status: z.enum(['DEVOLVIDA']).optional(),
})

const bodyValidationPipe = new ZodValidationPipe(
  updateReturnedDeliveryBodySchema,
)

type UpdatReturnedDeliveryBodySchema = z.infer<
  typeof updateReturnedDeliveryBodySchema
>

@Controller('/delivery/:id/returned')
@UseGuards(JwtAuthGuard)
export class MarkDeliveryReturnedController {
  constructor(private prisma: PrismaService) {}

  @Put()
  @HttpCode(204)
  async handle(
    @CurrentUser() userLoad: UserPayload,
    @Param('id') id: string,
    @Body(bodyValidationPipe) body: UpdatReturnedDeliveryBodySchema,
  ) {
    const { status } = body

    const delivery = await this.prisma.delivery.findUnique({
      where: { id },
    })

    if (!delivery) {
      throw new NotFoundException('Entrega não encontrada')
    }

    const deliveryToCheck = await this.prisma.delivery.findUnique({
      where: { id },
    })

    if (deliveryToCheck?.status !== 'ENTREGUE') {
      throw new NotFoundException('Esse pedido ainda não foi entregue!')
    }

    await this.prisma.delivery.update({
      where: { id },
      data: {
        status,
      },
    })
  }
}
