/*
import { expect, test } from 'vitest'

test('check if it works', () => {
  expect(2 + 2).toBe(4)
})
*/ import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PrismaService } from 'src/prisma/prisma.service'
import { ConflictException, NotFoundException } from '@nestjs/common'
import { CreateAccountController } from '@/controller/users/create-account.controller'
import { z } from 'zod'
import * as bcrypt from 'bcrypt'

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

  it('Deve criar o usuario se o usuario que esta tentando criar for um admin', async () => {
    const createAccountBodySchema = z.object({
      name: z.string(),
      cpf: z.string(),
      password: z.string(),
      role: z.enum(['ADMIN', 'ENTREGADOR']),
    })
    type CreateAccountBodySchema = z.infer<typeof createAccountBodySchema>

    const userPayload: UserPayload = {
      sub: '1',
      role: 'ADMIN',
    }

    // Mock do método findUnique para verificar o usuário logado
    vi.spyOn(prismaService.user, 'findUnique')
      .mockResolvedValueOnce({
        id: '1',
        name: 'User',
        cpf: '12345678900',
        password: 'hashedPassword',
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .mockResolvedValueOnce(null) // Para verificar se o CPF já existe

    // Gera o hash da senha
    const hashedPassword = await bcrypt.hash('password', 8)

    // Mock do método create para retornar o novo usuário criado
    vi.spyOn(prismaService.user, 'create').mockResolvedValue({
      id: '2',
      name: 'New User',
      cpf: '98765432100',
      password: hashedPassword,
      role: 'ENTREGADOR',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const body: CreateAccountBodySchema = {
      name: 'New User',
      cpf: '98765432100',
      password: 'password',
      role: 'ENTREGADOR',
    }

    // Verifica se o método handle não lança uma exceção
    await expect(controller.handle(userPayload, body)).resolves.not.toThrow()

    // Verifica se o método create foi chamado com os parâmetros corretos
    expect(prismaService.user.create).toHaveBeenCalledWith({
      data: {
        name: 'New User',
        cpf: '98765432100',
        password: expect.anything(), // Usa o hash da senha
        role: 'ENTREGADOR',
      },
    })
  })

  it('Deve lançar uma exceção se o CPF já existir', async () => {
    const createAccountBodySchema = z.object({
      name: z.string(),
      cpf: z.string(),
      password: z.string(),
      role: z.enum(['ADMIN', 'ENTREGADOR']),
    })
    type CreateAccountBodySchema = z.infer<typeof createAccountBodySchema>

    const userPayload: UserPayload = {
      sub: '1',
      role: 'ADMIN',
    }

    // Mock do método findUnique para verificar o usuário logado
    vi.spyOn(prismaService.user, 'findUnique')
      .mockResolvedValueOnce({
        id: '1',
        name: 'User',
        cpf: '12345678900',
        password: 'hashedPassword',
        role: 'ADMIN',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .mockResolvedValueOnce({
        id: '2',
        name: 'Existing User',
        cpf: '98765432100', // CPF que já existe
        password: 'hashedPassword',
        role: 'ENTREGADOR',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

    const body: CreateAccountBodySchema = {
      name: 'New User',
      cpf: '98765432100', // CPF que já existe
      password: 'password',
      role: 'ENTREGADOR',
    }

    // Verifica se a exceção é lançada
    await expect(controller.handle(userPayload, body)).rejects.toThrowError(
      new ConflictException('CPF já existente.'),
    )
  })
})
