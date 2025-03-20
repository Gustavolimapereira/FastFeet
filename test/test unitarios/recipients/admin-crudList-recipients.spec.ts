import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PrismaService } from '@/prisma/prisma.service'
import { NotFoundException } from '@nestjs/common'
import { ListRecipientController } from '@/controller/recipients/list-recipient.controller'

type UserPayload = {
  sub: string
  role: 'ADMIN' | 'ENTREGADOR'
}

describe('ListRecipientController', () => {
  let controller: ListRecipientController
  let prismaService: PrismaService

  beforeEach(() => {
    // Mock do PrismaService
    prismaService = {
      user: {
        findUnique: vi.fn(),
      },
      recipient: {
        findUnique: vi.fn(),
      },
    } as unknown as PrismaService

    // Instância do controller com o mock do PrismaService
    controller = new ListRecipientController(prismaService)
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

    vi.spyOn(prismaService.recipient, 'findUnique').mockResolvedValueOnce({
      id: '1',
      name: 'João Silva',
      cpf: '123.456.789-00',
      address: 'Rua das Flores, 123, Centro, São Paulo, SP',
      latitude: -23.55052, // Latitude de São Paulo
      longitude: -46.633308, // Longitude de São Paulo
    })

    const result = await controller.handle(userPayload, '1')

    expect(result).toEqual({
      user: {
        id: '1',
        name: 'João Silva',
        cpf: '123.456.789-00',
        address: 'Rua das Flores, 123, Centro, São Paulo, SP',
        latitude: -23.55052, // Latitude de São Paulo
        longitude: -46.633308, // Longitude de São Paulo
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
      new NotFoundException('Usuário não encontrado'),
    )
  })
})
