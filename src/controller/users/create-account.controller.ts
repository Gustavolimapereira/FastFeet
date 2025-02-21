import {
  Body,
  ConflictException,
  Controller,
  HttpCode,
  NotFoundException,
  Post,
  UseGuards,
} from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { CurrentUser } from 'src/auth/current-user-decorator'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'
import { UserPayload } from 'src/auth/jwt.strategy'
import { ZodValidationPipe } from 'src/pipes/zod-validation-pipe'
import { PrismaService } from 'src/prisma/prisma.service'
import { z } from 'zod'

const createAccountBodySchema = z.object({
  name: z.string(),
  cpf: z.string(),
  password: z.string(),
  role: z.enum(['ADMIN', 'ENTREGADOR']),
})

const bodyValidationPipe = new ZodValidationPipe(createAccountBodySchema)

type CreateAccountBodySchema = z.infer<typeof createAccountBodySchema>

@Controller('/accounts')
@UseGuards(JwtAuthGuard)
export class CreateAccountController {
  constructor(private prisma: PrismaService) {}

  @Post()
  @HttpCode(201)
  async handle(
    @CurrentUser() userLoad: UserPayload,
    @Body(bodyValidationPipe) body: CreateAccountBodySchema,
  ) {
    const userLogin = await this.prisma.user.findUnique({
      where: { id: userLoad.sub },
    })

    if (userLogin?.role !== 'ADMIN') {
      throw new NotFoundException('Usuário não é um admin do sistema')
    }

    const { name, cpf, password, role } = body

    const userWitchSameCpf = await this.prisma.user.findUnique({
      where: {
        cpf,
      },
    })

    if (userWitchSameCpf) {
      throw new ConflictException('CPF já existente.')
    }

    const hashedPassword = await bcrypt.hash(password, 8)

    await this.prisma.user.create({
      data: {
        name,
        cpf,
        password: hashedPassword,
        role,
      },
    })
  }
}
