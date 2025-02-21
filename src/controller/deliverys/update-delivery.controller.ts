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

const updateDeliveryBodySchema = z.object({
  recipientId: z.string().uuid().optional(),
  adminId: z.string().uuid().optional(),
  deliverymanId: z.string().uuid().optional(),
  status: z
    .enum(['AGUARDANDO', 'RETIRADA', 'ENTREGUE', 'DEVOLVIDA'])
    .optional(),
  photoUrl: z.string().url().optional(),
})

const bodyValidationPipe = new ZodValidationPipe(updateDeliveryBodySchema)

type UpdateDeliveryBodySchema = z.infer<typeof updateDeliveryBodySchema>

@Controller('/delivery/:id')
@UseGuards(JwtAuthGuard)
export class UpdateDeliveryController {
  constructor(private prisma: PrismaService) {}

  @Put()
  @HttpCode(204)
  async handle(
    @CurrentUser() userLoad: UserPayload,
    @Param('id') id: string,
    @Body(bodyValidationPipe) body: UpdateDeliveryBodySchema,
  ) {
    const { recipientId, adminId, deliverymanId, status, photoUrl } = body

    const userLogin = await this.prisma.user.findUnique({
      where: { id: userLoad.sub },
    })

    if (userLogin?.role !== 'ADMIN') {
      throw new NotFoundException('Usuário não é um admin do sistema')
    }

    await this.prisma.delivery.update({
      where: { id },
      data: {
        recipientId,
        adminId,
        deliverymanId,
        status,
        photoUrl,
      },
    })
  }
}
