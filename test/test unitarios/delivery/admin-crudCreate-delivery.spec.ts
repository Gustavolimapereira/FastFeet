import { CreateDeliverysController } from '@/controller/deliverys/delivery crud/create-delivery.controller'
import { PrismaService } from '@/prisma/prisma.service'
import { NotFoundException } from '@nestjs/common'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { z } from 'zod'

type UserPayload = {
  sub: string
  role: 'ADMIN' | 'ENTREGADOR'
}

describe('CreateDeliverysController', () => {
  let controller: CreateDeliverysController
  let prismaService: PrismaService

  beforeEach(() => {
    prismaService = {
      user: {
        findUnique: vi.fn(),
      },
      delivery: {
        create: vi.fn(),
      },
    } as unknown as PrismaService

    controller = new CreateDeliverysController(prismaService)
  })

  it('deve lançar uma exceção se o usuário que está tentando criar a entrega não for um admin', async () => {
    const createDeliveryBodySchema = z.object({
      recipientId: z.string().uuid(),
      adminId: z.string().uuid(),
      deliverymanId: z.string().uuid().optional(),
      status: z.enum(['AGUARDANDO', 'RETIRADA', 'ENTREGUE', 'DEVOLVIDA']),
      photoUrl: z.string().url().optional(),
    })
    type CreateDeliveryBodySchema = z.infer<typeof createDeliveryBodySchema>

    const userPayload: UserPayload = {
      sub: '1',
      role: 'ENTREGADOR',
    }

    vi.spyOn(prismaService.user, 'findUnique').mockResolvedValue({
      id: '1',
      name: 'User',
      cpf: '12345678900',
      password: 'hashedPassword',
      role: 'ENTREGADOR',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const body: CreateDeliveryBodySchema = {
      recipientId: '2',
      adminId: '1',
      deliverymanId: '3',
      status: 'AGUARDANDO',
      photoUrl: 'url da foto',
    }

    await expect(controller.handle(userPayload, body)).rejects.toThrowError(
      new NotFoundException('Usuário não é um admin do sistema'),
    )
  })

  it('deve criar uma nova entrega', async () => {
    const createDeliveryBodySchema = z.object({
      recipientId: z.string().uuid(),
      adminId: z.string().uuid(),
      deliverymanId: z.string().uuid().optional(),
      status: z.enum(['AGUARDANDO', 'RETIRADA', 'ENTREGUE', 'DEVOLVIDA']),
      photoUrl: z.string().url().optional(),
    })
    type CreateDeliveryBodySchema = z.infer<typeof createDeliveryBodySchema>

    const userPayload: UserPayload = {
      sub: '1',
      role: 'ADMIN',
    }

    vi.spyOn(prismaService.user, 'findUnique').mockResolvedValue({
      id: '1',
      name: 'User',
      cpf: '12345678900',
      password: 'hashedPassword',
      role: 'ADMIN',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const body: CreateDeliveryBodySchema = {
      recipientId: '2',
      adminId: '1',
      deliverymanId: '3',
      status: 'AGUARDANDO',
      photoUrl: 'url da foto',
    }

    await controller.handle(userPayload, body)

    expect(prismaService.delivery.create).toHaveBeenCalledWith({
      data: {
        recipientId: '2',
        adminId: '1',
        deliverymanId: '3',
        status: 'AGUARDANDO',
        photoUrl: 'url da foto',
      },
    })
  })
})
