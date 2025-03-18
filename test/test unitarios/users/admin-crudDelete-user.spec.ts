import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DeleteAccountController } from '@/controller/users/delete-account.controller'
import { PrismaService } from '@/prisma/prisma.service'
import { NotFoundException } from '@nestjs/common'

type UserPayload = {
  sub: string
  role: 'ADMIN' | 'ENTREGADOR'
}

describe('DeleteAccountController', () => {
  let controller: DeleteAccountController
  let prismaService: PrismaService

  beforeEach(() => {
    // Mock do PrismaService
    prismaService = {
      user: {
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
    } as unknown as PrismaService

    // Instância do controller com o mock do PrismaService
    controller = new DeleteAccountController(prismaService)
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

  it('deve deletar o usuário se o usuário que está tentando deletar for um admin', async () => {
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
        name: 'User to be deleted',
        cpf: '12345678902',
        password: 'hashedPassword',
        role: 'ENTREGADOR',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

    vi.spyOn(prismaService.user, 'delete').mockResolvedValue({} as never)

    await expect(controller.handle(userPayload, '2')).resolves.not.toThrow()
    expect(prismaService.user.delete).toHaveBeenCalledWith({
      where: { id: '2' },
    })
  })

  it('deve lançar uma exceção se o usuário a ser deletado não for encontrado', async () => {
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
