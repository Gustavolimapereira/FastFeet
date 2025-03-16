import { AppModule } from '@/app.module'
import { PrismaService } from '@/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import * as bcrypt from 'bcrypt'
import request from 'supertest'

describe('Autenticação (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)

    await app.init()
  })

  test('[POST] /sessions', async () => {
    const password = '123456'

    await prisma.user.create({
      data: {
        name: 'admin',
        cpf: '000.000.000-00',
        password: await bcrypt.hash(password, 8),
        role: 'ADMIN',
      },
    })

    const responseLogin = await request(app.getHttpServer())
      .post('/sessions')
      .send({
        cpf: '000.000.000-00',
        password: '123456',
      })

    expect(responseLogin.statusCode).toBe(201)
  })
})
