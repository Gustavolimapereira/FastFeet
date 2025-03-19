import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PrismaService } from '@/prisma/prisma.service'
import { NotFoundException } from '@nestjs/common'
import { DeleteDeliveryController } from '@/controller/deliverys/delivery crud/delete-delivery.controller'

type UserPayload = {
  sub: string
  role: 'ADMIN' | 'ENTREGADOR'
}

describe('DeleteDeliveryController', () => {
  let controller: DeleteDeliveryController
  let prismaService: PrismaService

  beforeEach(() => {
    // Mock do PrismaService
    prismaService = {
      user: {
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
      delivery: {
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
    } as unknown as PrismaService

    // Instância do controller com o mock do PrismaService
    controller = new DeleteDeliveryController(prismaService)
  })

  it('deve lançar uma exceção se o usuário que está tentando deletar não for um admin', async () => {
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

  it('deve deletar a entrega se o usuário que está tentando deletar for um admin', async () => {
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
      id: '2',
      recipientId: '2',
      adminId: '1',
      deliverymanId: '3',
      status: 'AGUARDANDO',
      photoUrl: 'url da foto',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    vi.spyOn(prismaService.delivery, 'delete').mockResolvedValue({} as never)

    await expect(controller.handle(userPayload, '2')).resolves.not.toThrow()
    expect(prismaService.delivery.delete).toHaveBeenCalledWith({
      where: { id: '2' },
    })
  })

  it('deve lançar uma exceção se a entrega a ser deletada não for encontrada', async () => {
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
      new NotFoundException('Pedido não encontrado'),
    )
  })
})
