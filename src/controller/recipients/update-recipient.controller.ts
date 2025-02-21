import {
  Body,
  ConflictException,
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

const updateRecipientBodySchema = z.object({
  name: z.string().optional(),
  cpf: z.string().optional(),
  address: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

const bodyValidationPipe = new ZodValidationPipe(updateRecipientBodySchema)

type UpdateRecipientBodySchema = z.infer<typeof updateRecipientBodySchema>

@Controller('/recipients/:id')
@UseGuards(JwtAuthGuard)
export class UpdateRecipientController {
  constructor(private prisma: PrismaService) {}

  @Put()
  @HttpCode(204)
  async handle(
    @CurrentUser() userLoad: UserPayload,
    @Param('id') id: string,
    @Body(bodyValidationPipe) body: UpdateRecipientBodySchema,
  ) {
    const { name, cpf, address, latitude, longitude } = body

    const userLogin = await this.prisma.user.findUnique({
      where: { id: userLoad.sub },
    })

    if (userLogin?.role !== 'ADMIN') {
      throw new NotFoundException('Usuário não é um admin do sistema')
    }

    const user = await this.prisma.recipient.findUnique({
      where: { id },
    })

    if (!user) {
      throw new NotFoundException('Destinatário não encontrado')
    }

    if (cpf && cpf !== user.cpf) {
      const userWitchSameCpf = await this.prisma.recipient.findUnique({
        where: { cpf },
      })

      if (userWitchSameCpf) {
        throw new ConflictException('CPF já existente.')
      }
    }

    await this.prisma.recipient.update({
      where: { id },
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
