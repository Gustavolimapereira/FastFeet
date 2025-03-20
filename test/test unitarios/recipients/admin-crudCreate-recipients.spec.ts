import { CreateRecipientsController } from '@/controller/recipients/create-recipient.controller'
import { PrismaService } from '@/prisma/prisma.service'
import { ConflictException, NotFoundException } from '@nestjs/common'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { z } from 'zod'

type UserPayload = {
  sub: string
  role: 'ADMIN' | 'ENTREGADOR'
}

describe('CreateRecipientsController', () => {
  let controller: CreateRecipientsController
  let prismaService: PrismaService

  beforeEach(() => {
    prismaService = {
      user: {
        findUnique: vi.fn(),
      },
      recipient: {
        create: vi.fn(),
        findUnique: vi.fn(),
      },
    } as unknown as PrismaService

    controller = new CreateRecipientsController(prismaService)
  })

  it('deve lançar uma exceção se o usuário que está tentando criar o cliente não for um admin', async () => {
    const createRecipientBodySchema = z.object({
      name: z.string(),
      cpf: z.string(),
      address: z.string(),
      latitude: z.number(),
      longitude: z.number(),
    })

    type CreateRecipientBodySchema = z.infer<typeof createRecipientBodySchema>

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

    const body: CreateRecipientBodySchema = {
      name: 'João Silva',
      cpf: '123.456.789-00',
      address: 'Rua das Flores, 123, Centro, São Paulo, SP',
      latitude: -23.55052, // Latitude de São Paulo
      longitude: -46.633308, // Longitude de São Paulo
    }

    await expect(controller.handle(userPayload, body)).rejects.toThrowError(
      new NotFoundException('Usuário não é um admin do sistema'),
    )
  })

  it('deve criar um novo cliente', async () => {
    const createRecipientBodySchema = z.object({
      name: z.string(),
      cpf: z.string(),
      address: z.string(),
      latitude: z.number(),
      longitude: z.number(),
    })

    type CreateRecipientBodySchema = z.infer<typeof createRecipientBodySchema>

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

    const body: CreateRecipientBodySchema = {
      name: 'João Silva',
      cpf: '123.456.789-00',
      address: 'Rua das Flores, 123, Centro, São Paulo, SP',
      latitude: -23.55052, // Latitude de São Paulo
      longitude: -46.633308, // Longitude de São Paulo
    }

    await controller.handle(userPayload, body)

    expect(prismaService.recipient.create).toHaveBeenCalledWith({
      data: {
        name: 'João Silva',
        cpf: '123.456.789-00',
        address: 'Rua das Flores, 123, Centro, São Paulo, SP',
        latitude: -23.55052, // Latitude de São Paulo
        longitude: -46.633308, // Longitude de São Paulo
      },
    })
  })

  it('deve lançar uma exceção se o CPF já existir', async () => {
    const createRecipientBodySchema = z.object({
      name: z.string(),
      cpf: z.string(),
      address: z.string(),
      latitude: z.number(),
      longitude: z.number(),
    })

    type CreateRecipientBodySchema = z.infer<typeof createRecipientBodySchema>

    const userPayload: UserPayload = {
      sub: '1',
      role: 'ADMIN',
    }

    vi.spyOn(prismaService.user, 'findUnique').mockResolvedValue({
      id: '1',
      name: 'Admin User',
      cpf: '12345678901',
      password: 'hashedPassword',
      role: 'ADMIN',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    vi.spyOn(prismaService.recipient, 'findUnique').mockResolvedValue({
      id: '2',
      name: 'Existing User',
      cpf: '12345678900',
      address: 'Existing Address',
      latitude: 0,
      longitude: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const body: CreateRecipientBodySchema = {
      name: 'New User',
      cpf: '12345678900',
      address: 'New Address',
      latitude: 0,
      longitude: 0,
    }

    await expect(controller.handle(userPayload, body)).rejects.toThrowError(
      new ConflictException('CPF já existente.'),
    )
  })
})
