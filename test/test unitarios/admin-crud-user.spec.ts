/*
import { expect, test } from 'vitest'

test('check if it works', () => {
  expect(2 + 2).toBe(4)
})
*/ import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PrismaService } from 'src/prisma/prisma.service'
import { NotFoundException } from '@nestjs/common'
import { CreateAccountController } from '@/controller/users/create-account.controller'
import { z } from 'zod'

type UserPayload = {
  sub: string
  role: 'ADMIN' | 'ENTREGADOR' // Adicionando role para o teste
}

describe('CreateAccountController', () => {
  let controller: CreateAccountController
  let prismaService: PrismaService

  beforeEach(() => {
    // Mock do PrismaService
    prismaService = {
      user: {
        findUnique: vi.fn(),
        create: vi.fn(),
      },
    } as unknown as PrismaService

    // Instância do controller com o mock do PrismaService
    controller = new CreateAccountController(prismaService)
  })

  it('should throw NotFoundException if user is not an admin', async () => {
    const createAccountBodySchema = z.object({
      name: z.string(),
      cpf: z.string(),
      password: z.string(),
      role: z.enum(['ADMIN', 'ENTREGADOR']),
    })
    type CreateAccountBodySchema = z.infer<typeof createAccountBodySchema>

    // Mock do usuário logado que não é admin (role está faltando aqui)
    const userPayload: UserPayload = {
      sub: '1',
      role: 'ENTREGADOR', // Adicionando o role para o usuário
    }

    // Mock do retorno do PrismaService
    vi.spyOn(prismaService.user, 'findUnique').mockResolvedValue({
      id: '1',
      name: 'User',
      cpf: '12345678900',
      password: 'hashedPassword',
      role: 'ENTREGADOR',
      createdAt: new Date(), // Propriedade adicionada
      updatedAt: new Date(), // Propriedade adicionada
    })

    // Dados do corpo da requisição
    const body: CreateAccountBodySchema = {
      name: 'New User',
      cpf: '98765432100',
      password: 'password',
      role: 'ENTREGADOR', // Tipo explícito
    }

    // Verifica se a exceção é lançada
    await expect(controller.handle(userPayload, body)).rejects.toThrowError(
      new NotFoundException('Usuário não é um admin do sistema'),
    ) // Mensagem de erro detalhada
  })
})
