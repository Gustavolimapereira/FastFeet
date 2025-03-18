import { UpdateAccountController } from '@/controller/users/update-account.controller'
import { NotFoundException } from '@nestjs/common'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PrismaService } from '@/prisma/prisma.service'
import { z } from 'zod'

type UserPayload = {
  sub: string
  role: 'ADMIN' | 'ENTREGADOR'
}

describe('DeleteAccountController', () => {
  let controller: UpdateAccountController
  let prismaService: PrismaService

  beforeEach(() => {
    // Mock do PrismaService
    prismaService = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    } as unknown as PrismaService

    // Instância do controller com o mock do PrismaService
    controller = new UpdateAccountController(prismaService)
  })

  it('deve lançar uma exceção se o usuário que está tentando atualizar não for um admin', async () => {
    const updateAccountBodySchema = z.object({
      name: z.string(),
      cpf: z.string(),
      password: z.string(),
      role: z.enum(['ADMIN', 'ENTREGADOR']),
    })
    type UpdateAccountBodySchema = z.infer<typeof updateAccountBodySchema>

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

    const body: UpdateAccountBodySchema = {
      name: 'New User',
      cpf: '98765432100',
      password: 'password',
      role: 'ENTREGADOR', // Tipo explícito
    }

    await expect(
      controller.handle(userPayload, '2', body),
    ).rejects.toThrowError(
      new NotFoundException('Usuário não é um admin do sistema'),
    )
  })

  it('deve atualizar se o usuário que está tentando atualizar for um admin', async () => {
    const updateAccountBodySchema = z.object({
      name: z.string(),
      cpf: z.string(),
      password: z.string(),
      role: z.enum(['ADMIN', 'ENTREGADOR']),
    })
    type UpdateAccountBodySchema = z.infer<typeof updateAccountBodySchema>

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
        name: 'User to be updated',
        cpf: '12345678902',
        password: 'hashedPassword',
        role: 'ENTREGADOR',
        createdAt: new Date(),
      })

    // Configura o mock do `update`
    vi.spyOn(prismaService.user, 'update').mockResolvedValue({
      id: '2',
      name: 'User to be updated',
      cpf: '12345678902',
      role: 'ENTREGADOR',
    })

    const body: UpdateAccountBodySchema = {
      name: 'User to be updated',
      cpf: '12345678902',
      password: 'hashedPassword',
      role: 'ENTREGADOR',
    }

    const result = await controller.handle(userPayload, '2', body)

    // Verifica se o método não retorna nada
    expect(result).toBeUndefined()

    // Verifica se o método `update` foi chamado corretamente
    expect(prismaService.user.update).toHaveBeenCalledWith({
      where: { id: '2' },
      data: {
        name: 'User to be updated',
        cpf: '12345678902',
        password: expect.any(String), // A senha será hasheada, então usamos `expect.any`
        role: 'ENTREGADOR',
      },
    })
  })

  it('deve lançar uma exceção se o usuário a ser listado não for encontrado', async () => {
    const updateAccountBodySchema = z.object({
      name: z.string(),
      cpf: z.string(),
      password: z.string(),
      role: z.enum(['ADMIN', 'ENTREGADOR']),
    })
    type UpdateAccountBodySchema = z.infer<typeof updateAccountBodySchema>

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

    const body: UpdateAccountBodySchema = {
      name: 'New User',
      cpf: '98765432100',
      password: 'password',
      role: 'ENTREGADOR', // Tipo explícito
    }

    await expect(
      controller.handle(userPayload, '2', body),
    ).rejects.toThrowError(new NotFoundException('Usuário não encontrado'))
  })
})
