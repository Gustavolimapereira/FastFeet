import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ListDeliveryController } from '@/controller/deliverys/delivery crud/list-delivery.controller'
import { PrismaService } from '@/prisma/prisma.service'
import { NotFoundException } from '@nestjs/common'

type UserPayload = {
  sub: string
  role: 'ADMIN' | 'ENTREGADOR'
}

describe('ListDeliveryController', () => {
  let controller: ListDeliveryController
  let prismaService: PrismaService

  beforeEach(() => {
    // Mock do PrismaService
    prismaService = {
      user: {
        findUnique: vi.fn(),
      },
      delivery: {
        findUnique: vi.fn(),
      },
    } as unknown as PrismaService

    // Instância do controller com o mock do PrismaService
    controller = new ListDeliveryController(prismaService)
  })

  it('deve lançar uma exceção se o usuário que está tentando listar não for um admin', async () => {
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

    await expect(controller.handle(userPayload, '2')).rejects.toThrowError(
      new NotFoundException('Usuário não é um admin do sistema'),
    )
  })

  it('deve listar o usuário se o usuário que está tentando listar for um admin', async () => {
    const userPayload: UserPayload = {
      sub: '1',
      role: 'ADMIN',
    }

    vi.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce({
      id: '1',
      name: 'Admin User',
      cpf: '12345678901',
      password: 'hashedPassword',
      role: 'ADMIN',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    vi.spyOn(prismaService.delivery, 'findUnique').mockResolvedValueOnce({
      id: '1',
      recipientId: '1',
      adminId: '1',
      deliverymanId: '1',
      status: 'AGUARDANDO',
      photoUrl: 'photoUrl',
    })

    const result = await controller.handle(userPayload, '1')

    expect(result).toEqual({
      delivery: {
        id: '1',
        recipientId: '1',
        adminId: '1',
        deliverymanId: '1',
        status: 'AGUARDANDO',
        photoUrl: 'photoUrl',
      },
    })
  })

  it('deve lançar uma exceção se a entrega a ser listado não for encontrada', async () => {
    const userPayload: UserPayload = {
      sub: '1',
      role: 'ADMIN',
    }

    vi.spyOn(prismaService.user, 'findUnique')
      .mockResolvedValueOnce({
        id: '1',
        name: 'Admin User',
        cpf: '12345678901',
        password: 'hashedPassword',
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .mockResolvedValueOnce(null)

    await expect(controller.handle(userPayload, '2')).rejects.toThrowError(
      new NotFoundException('Entrega não encontrada'),
    )
  })
})
