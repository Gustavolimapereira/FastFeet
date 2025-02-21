import {
  Body,
  Controller,
  HttpCode,
  NotFoundException,
  Post,
  UseGuards,
} from '@nestjs/common'
import { CurrentUser } from 'src/auth/current-user-decorator'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'
import { UserPayload } from 'src/auth/jwt.strategy'
import { ZodValidationPipe } from 'src/pipes/zod-validation-pipe'
import { PrismaService } from 'src/prisma/prisma.service'
import { z } from 'zod'

const createDeliveryBodySchema = z.object({
  recipientId: z.string().uuid(),
  adminId: z.string().uuid(),
  deliverymanId: z.string().uuid().optional(),
  status: z.enum(['AGUARDANDO', 'RETIRADA', 'ENTREGUE', 'DEVOLVIDA']),
  photoUrl: z.string().url().optional(),
})

const bodyValidationPipe = new ZodValidationPipe(createDeliveryBodySchema)

type CreateDeliveryBodySchema = z.infer<typeof createDeliveryBodySchema>

// Destinatarios
@Controller('/delivery')
@UseGuards(JwtAuthGuard)
export class CreateDeliverysController {
  constructor(private prisma: PrismaService) {}

  @Post()
  @HttpCode(201)
  async handle(
    @CurrentUser() userLoad: UserPayload,
    @Body(bodyValidationPipe) body: CreateDeliveryBodySchema,
  ) {
    const userLogin = await this.prisma.user.findUnique({
      where: { id: userLoad.sub },
    })

    if (userLogin?.role !== 'ADMIN') {
      throw new NotFoundException('Usuário não é um admin do sistema')
    }

    const { recipientId, adminId, deliverymanId, status, photoUrl } = body

    await this.prisma.delivery.create({
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
