import {
  Body,
  ConflictException,
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

const createRecipientBodySchema = z.object({
  name: z.string(),
  cpf: z.string(),
  address: z.string(),
  latitude: z.number(),
  longitude: z.number(),
})

const bodyValidationPipe = new ZodValidationPipe(createRecipientBodySchema)

type CreateRecipientBodySchema = z.infer<typeof createRecipientBodySchema>

// Destinatarios
@Controller('/recipients')
@UseGuards(JwtAuthGuard)
export class CreateRecipientsController {
  constructor(private prisma: PrismaService) {}

  @Post()
  @HttpCode(201)
  async handle(
    @CurrentUser() userLoad: UserPayload,
    @Body(bodyValidationPipe) body: CreateRecipientBodySchema,
  ) {
    const userLogin = await this.prisma.user.findUnique({
      where: { id: userLoad.sub },
    })

    if (userLogin?.role !== 'ADMIN') {
      throw new NotFoundException('Usuário não é um admin do sistema')
    }

    const { name, cpf, address, latitude, longitude } = body

    const userWitchSameCpf = await this.prisma.recipient.findUnique({
      where: {
        cpf,
      },
    })

    if (userWitchSameCpf) {
      throw new ConflictException('CPF já existente.')
    }

    await this.prisma.recipient.create({
      data: {
        name,
        cpf,
        address,
        latitude,
        longitude,
      },
    })
  }
}
