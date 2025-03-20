import { NotFoundException } from '@nestjs/common'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PrismaService } from '@/prisma/prisma.service'
import { z } from 'zod'
import { UpdateRecipientController } from '@/controller/recipients/update-recipient.controller'

type UserPayload = {
  sub: string
  role: 'ADMIN' | 'ENTREGADOR'
}

describe('UpdateRecipientController', () => {
  let controller: UpdateRecipientController
  let prismaService: PrismaService

  beforeEach(() => {
    // Mock do PrismaService
    prismaService = {
      user: {
        findUnique: vi.fn(),
      },
      recipient: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
    } as unknown as PrismaService

    // Instância do controller com o mock do PrismaService
    controller = new UpdateRecipientController(prismaService)
  })

  it('deve lançar uma exceção se o usuário que está tentando atualizar não for um admin', async () => {
    const updateRecipientBodySchema = z.object({
      name: z.string().optional(),
      cpf: z.string().optional(),
      address: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    })
    type UpdateRecipientBodySchema = z.infer<typeof updateRecipientBodySchema>

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

    const body: UpdateRecipientBodySchema = {
      name: 'João Silva',
      cpf: '123.456.789-00',
      address: 'Rua das Flores, 123, Centro, São Paulo, SP',
      latitude: -23.55052, // Latitude de São Paulo
      longitude: -46.633308, // Longitude de São Paulo
    }

    await expect(
      controller.handle(userPayload, '1', body),
    ).rejects.toThrowError(
      new NotFoundException('Usuário não é um admin do sistema'),
    )
  })

  it('deve atualizar se o usuário que está tentando atualizar for um admin', async () => {
    const updateRecipientBodySchema = z.object({
      name: z.string().optional(),
      cpf: z.string().optional(),
      address: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    })
    type UpdateRecipientBodySchema = z.infer<typeof updateRecipientBodySchema>

    const userPayload: UserPayload = {
      sub: '1',
      role: 'ADMIN',
    }

    // Mock do usuário admin
    vi.spyOn(prismaService.user, 'findUnique').mockResolvedValue({
      id: '1',
      name: 'User',
      cpf: '12345678900',
      password: 'hashedPassword',
      role: 'ADMIN',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Mock do destinatário existente
    vi.spyOn(prismaService.recipient, 'findUnique').mockResolvedValue({
      id: '2',
      name: 'João Silva',
      cpf: '123.456.789-00',
      address: 'Rua das Flores, 123, Centro, São Paulo, SP',
      latitude: -23.55052, // Latitude de São Paulo
      longitude: -46.633308, // Longitude de São Paulo
    })

    // Configura o mock do `update`
    vi.spyOn(prismaService.recipient, 'update').mockResolvedValue({
      id: '2',
      name: 'João Silva atualizado',
      cpf: '123.456.789-00',
      address: 'Rua das Flores, 123, Centro, São Paulo, SP',
      latitude: -23.55052, // Latitude de São Paulo
      longitude: -46.633308, // Longitude de São Paulo
    })

    const body: UpdateRecipientBodySchema = {
      name: 'João Silva atualizado',
      cpf: '123.456.789-00',
      address: 'Rua das Flores, 123, Centro, São Paulo, SP',
      latitude: -23.55052, // Latitude de São Paulo
      longitude: -46.633308, // Longitude de São Paulo
    }

    const result = await controller.handle(userPayload, '2', body)

    // Verifica se o método não retorna nada
    expect(result).toBeUndefined()

    // Verifica se o método update foi chamado corretamente
    expect(prismaService.recipient.update).toHaveBeenCalledWith({
      where: { id: '2' },
      data: {
        name: 'João Silva atualizado',
        cpf: '123.456.789-00',
        address: 'Rua das Flores, 123, Centro, São Paulo, SP',
        latitude: -23.55052, // Latitude de São Paulo
        longitude: -46.633308, // Longitude de São Paulo
      },
    })
  })

  it('deve lançar uma exceção se o usuário que está tentando atualizar não for encontrado', async () => {
    const updateRecipientBodySchema = z.object({
      name: z.string().optional(),
      cpf: z.string().optional(),
      address: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    })
    type UpdateRecipientBodySchema = z.infer<typeof updateRecipientBodySchema>

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

    const body: UpdateRecipientBodySchema = {
      name: 'João Silva',
      cpf: '123.456.789-00',
      address: 'Rua das Flores, 123, Centro, São Paulo, SP',
      latitude: -23.55052, // Latitude de São Paulo
      longitude: -46.633308, // Longitude de São Paulo
    }

    await expect(
      controller.handle(userPayload, '3', body),
    ).rejects.toThrowError(new NotFoundException('Destinatário não encontrado'))
  })
})
