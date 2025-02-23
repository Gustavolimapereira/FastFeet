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

const updateCompletedDeliveryBodySchema = z.object({
  status: z.enum(['ENTREGUE']).optional(),
})

const bodyValidationPipe = new ZodValidationPipe(
  updateCompletedDeliveryBodySchema,
)

type UpdatedCompletedDeDeliveryBodySchema = z.infer<
  typeof updateCompletedDeliveryBodySchema
>

@Controller('/delivery/:id/completed')
@UseGuards(JwtAuthGuard)
export class MarkDeliveryWitchDrawController {
  constructor(private prisma: PrismaService) {}

  @Put()
  @HttpCode(204)
  async handle(
    @CurrentUser() userLoad: UserPayload,
    @Param('id') id: string,
    @Body(bodyValidationPipe) body: UpdatedCompletedDeDeliveryBodySchema,
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

    if (deliveryToCheck?.status !== 'RETIRADA') {
      throw new NotFoundException('Essa encomaneda ainda não foi retirada!')
    }

    await this.prisma.delivery.update({
      where: { id },
      data: {
        status,
      },
    })
  }
}
