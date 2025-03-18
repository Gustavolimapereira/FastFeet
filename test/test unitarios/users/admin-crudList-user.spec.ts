import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PrismaService } from '@/prisma/prisma.service'
import { NotFoundException } from '@nestjs/common'
import { ListAccountController } from '@/controller/users/list-account.controller'

type UserPayload = {
  sub: string
  role: 'ADMIN' | 'ENTREGADOR'
}

describe('ListAccountController', () => {
  let controller: ListAccountController
  let prismaService: PrismaService

  beforeEach(() => {
    // Mock do PrismaService
    prismaService = {
      user: {
        findUnique: vi.fn(),
      },
    } as unknown as PrismaService

    // Instância do controller com o mock do PrismaService
    controller = new ListAccountController(prismaService)
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
      .mockResolvedValueOnce({
        id: '2',
        name: 'User to be listed',
        cpf: '12345678902',
        role: 'ENTREGADOR',
        createdAt: new Date(),
      })

    const result = await controller.handle(userPayload, '2')

    expect(result).toEqual({
      user: {
        id: '2',
        name: 'User to be listed',
        cpf: '12345678902',
        role: 'ENTREGADOR',
        createdAt: expect.any(Date),
      },
    })

    expect(prismaService.user.findUnique).toHaveBeenCalledWith({
      where: { id: '2' },
      select: {
        id: true,
        name: true,
        cpf: true,
        role: true,
        createdAt: true,
      },
    })
  })

  it('deve lançar uma exceção se o usuário a ser listado não for encontrado', async () => {
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
