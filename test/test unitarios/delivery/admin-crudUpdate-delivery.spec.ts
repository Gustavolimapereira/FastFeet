import { NotFoundException } from '@nestjs/common'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PrismaService } from '@/prisma/prisma.service'
import { z } from 'zod'
import { UpdateDeliveryController } from '@/controller/deliverys/delivery crud/update-delivery.controller'

type UserPayload = {
  sub: string
  role: 'ADMIN' | 'ENTREGADOR'
}

describe('UpdateDeliveryController', () => {
  let controller: UpdateDeliveryController
  let prismaService: PrismaService

  beforeEach(() => {
    // Mock do PrismaService
    prismaService = {
      user: {
        findUnique: vi.fn(),
      },
      delivery: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    } as unknown as PrismaService

    // Instância do controller com o mock do PrismaService
    controller = new UpdateDeliveryController(prismaService)
  })

  it('deve lançar uma exceção se o usuário que está tentando atualizar não for um admin', async () => {
    const updateDeliveryBodySchema = z.object({
      recipientId: z.string().uuid().optional(),
      adminId: z.string().uuid().optional(),
      deliverymanId: z.string().uuid().optional(),
      status: z
        .enum(['AGUARDANDO', 'RETIRADA', 'ENTREGUE', 'DEVOLVIDA'])
        .optional(),
      photoUrl: z.string().url().optional(),
    })
    type UpdateDeliveryBodySchema = z.infer<typeof updateDeliveryBodySchema>

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

    const body: UpdateDeliveryBodySchema = {
      recipientId: '1',
      adminId: '1',
      deliverymanId: '1',
      status: 'AGUARDANDO',
      photoUrl: 'foto url',
    }

    await expect(
      controller.handle(userPayload, '2', body),
    ).rejects.toThrowError(
      new NotFoundException('Usuário não é um admin do sistema'),
    )
  })

  it('deve atualizar se o usuário que está tentando atualizar for um admin', async () => {
    const updateDeliveryBodySchema = z.object({
      recipientId: z.string().uuid().optional(),
      adminId: z.string().uuid().optional(),
      deliverymanId: z.string().uuid().optional(),
      status: z
        .enum(['AGUARDANDO', 'RETIRADA', 'ENTREGUE', 'DEVOLVIDA'])
        .optional(),
      photoUrl: z.string().url().optional(),
    })
    type UpdateDeliveryBodySchema = z.infer<typeof updateDeliveryBodySchema>

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

    // Configura o mock do `update`
    vi.spyOn(prismaService.delivery, 'update').mockResolvedValue({
      recipientId: '1',
      adminId: '1',
      deliverymanId: '1',
      status: 'AGUARDANDO',
      photoUrl: 'foto url',
    })

    const body: UpdateDeliveryBodySchema = {
      recipientId: '1',
      adminId: '1',
      deliverymanId: '1',
      status: 'AGUARDANDO',
      photoUrl: 'foto url',
    }

    const result = await controller.handle(userPayload, '2', body)

    // Verifica se o método não retorna nada
    expect(result).toBeUndefined()

    // Verifica se o método `update` foi chamado corretamente
    expect(prismaService.delivery.update).toHaveBeenCalledWith({
      where: { id: '2' },
      data: {
        recipientId: '1',
        adminId: '1',
        deliverymanId: '1',
        status: 'AGUARDANDO',
        photoUrl: 'foto url',
      },
    })
  })
})
