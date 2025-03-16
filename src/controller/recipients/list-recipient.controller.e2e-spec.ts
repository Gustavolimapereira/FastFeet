import { AppModule } from '@/app.module'
import { PrismaService } from '@/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import * as bcrypt from 'bcrypt'
import request from 'supertest'

describe('List recipient (E2E)', () => {
  let app: INestApplication
  let prisma: PrismaService
  let jwt: JwtService

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleRef.createNestApplication()

    prisma = moduleRef.get(PrismaService)

    jwt = moduleRef.get(JwtService)

    await app.init()
  })

  test('[GET] /recipients/:id', async () => {
    const password = '123456'

    const user = await prisma.user.create({
      data: {
        name: 'admin',
        cpf: '000.000.000-00',
        password: await bcrypt.hash(password, 8),
        role: 'ADMIN',
      },
    })

    const accessToken = jwt.sign({ sub: user.id })

    const responseLogin = await request(app.getHttpServer())
      .post('/sessions')
      .send({
        cpf: '000.000.000-00',
        password: '123456',
      })

    expect(responseLogin.statusCode).toBe(201)

    const recipientCreate = await prisma.recipient.create({
      data: {
        name: 'Teste e2e',
        cpf: '111.111.111-11',
        address: 'Rua Um, 123 - Centro, São Paulo - SP',
        latitude: -23.55052,
        longitude: -46.633308,
      },
    })

    const response = await request(app.getHttpServer())
      .get(`/recipients/${recipientCreate.id}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(response.statusCode).toBe(200)
  })
})
