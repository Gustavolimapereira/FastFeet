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
import * as bcrypt from 'bcrypt'
import { CurrentUser } from 'src/auth/current-user-decorator'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'
import { UserPayload } from 'src/auth/jwt.strategy'
import { ZodValidationPipe } from 'src/pipes/zod-validation-pipe'
import { PrismaService } from 'src/prisma/prisma.service'
import { z } from 'zod'

const updateAccountBodySchema = z.object({
  name: z.string().optional(),
  cpf: z.string().optional(),
  password: z.string().optional(),
  role: z.enum(['ADMIN', 'ENTREGADOR']).optional(),
})

const bodyValidationPipe = new ZodValidationPipe(updateAccountBodySchema)

type UpdateAccountBodySchema = z.infer<typeof updateAccountBodySchema>

@Controller('/accounts/:id')
@UseGuards(JwtAuthGuard)
export class UpdateAccountController {
  constructor(private prisma: PrismaService) {}

  @Put()
  @HttpCode(204)
  async handle(
    @CurrentUser() userLoad: UserPayload,
    @Param('id') id: string,
    @Body(bodyValidationPipe) body: UpdateAccountBodySchema,
  ) {
    const { name, cpf, password, role } = body

    const userLogin = await this.prisma.user.findUnique({
      where: { id: userLoad.sub },
    })

    if (userLogin?.role !== 'ADMIN') {
      throw new NotFoundException('Usuário não é um admin do sistema')
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      throw new NotFoundException('Usuário não encontrado')
    }

    if (cpf && cpf !== user.cpf) {
      const userWitchSameCpf = await this.prisma.user.findUnique({
        where: { cpf },
      })

      if (userWitchSameCpf) {
        throw new ConflictException('CPF já existente.')
      }
    }

    let hashedPassword: string | undefined
    if (password) {
      hashedPassword = await bcrypt.hash(password, 8)
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        name,
        cpf,
        password: hashedPassword,
        role,
      },
    })
  }
}
