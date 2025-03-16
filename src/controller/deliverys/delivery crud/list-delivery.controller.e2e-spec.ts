import { AppModule } from '@/app.module'
import { PrismaService } from '@/prisma/prisma.service'
import { INestApplication } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { Test } from '@nestjs/testing'
import * as bcrypt from 'bcrypt'
import request from 'supertest'

describe('Listar delivery (E2E)', () => {
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

  test('[GET] /delivery', async () => {
    const password = '123456'

    const user = await prisma.user.create({
      data: {
        name: 'admin',
        cpf: '000.000.000-00',
        password: await bcrypt.hash(password, 8),
        role: 'ADMIN',
      },
    })

    const deliveryMan = await prisma.user.create({
      data: {
        name: 'deliveryMan',
        cpf: '999.999.999-99',
        password: await bcrypt.hash(password, 8),
        role: 'ENTREGADOR',
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

    const createRecipient = await prisma.recipient.create({
      data: {
        name: 'Teste e2e',
        cpf: '111.111.111-11',
        address: 'Rua Um, 123 - Centro, São Paulo - SP',
        latitude: -23.55052,
        longitude: -46.633308,
      },
    })

    const createDelivery = await prisma.delivery.create({
      data: {
        recipientId: createRecipient.id,
        adminId: user.id,
        deliverymanId: deliveryMan.id,
        status: 'AGUARDANDO',
        photoUrl:
          'https://blog.zanottirefrigeracao.com.br/wp-content/uploads/2017/09/lanche-na-chapa-1024x768.jpg',
      },
    })

    const responseDelete = await request(app.getHttpServer())
      .get(`/delivery/${createDelivery.id}`)
      .set('Authorization', `Bearer ${accessToken}`)

    expect(responseDelete.statusCode).toBe(200)
  })
})
