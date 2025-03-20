import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PrismaService } from '@/prisma/prisma.service'
import { NotFoundException } from '@nestjs/common'
import { DeleteRecipientController } from '@/controller/recipients/delete-recipient.controller'

type UserPayload = {
  sub: string
  role: 'ADMIN' | 'ENTREGADOR'
}

describe('DeleteRecipientController', () => {
  let controller: DeleteRecipientController
  let prismaService: PrismaService

  beforeEach(() => {
    // Mock do PrismaService
    prismaService = {
      user: {
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
      recipient: {
        findUnique: vi.fn(),
        delete: vi.fn(),
        findMany: vi.fn(),
      },
      delivery: {
        findMany: vi.fn(), // Adicione o mock para o método findMany do delivery
      },
    } as unknown as PrismaService

    // Instância do controller com o mock do PrismaService
    controller = new DeleteRecipientController(prismaService)
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

  it('deve deletar o cliente se o usuário que está tentando deletar for um admin', async () => {
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
      id: '2',
      name: 'João Silva',
      cpf: '123.456.789-00',
      address: 'Rua das Flores, 123, Centro, São Paulo, SP',
      latitude: -23.55052, // Latitude de São Paulo
      longitude: -46.633308, // Longitude de São Paulo
    })

    vi.spyOn(prismaService.delivery, 'findMany').mockResolvedValueOnce([]) // Mock para findMany do delivery

    vi.spyOn(prismaService.recipient, 'delete').mockResolvedValue({} as never)

    await expect(controller.handle(userPayload, '2')).resolves.not.toThrow()
    expect(prismaService.recipient.delete).toHaveBeenCalledWith({
      where: { id: '2' },
    })
  })

  it('deve lançar uma exceção se o destinatário tiver encomendas associadas', async () => {
    const userPayload: UserPayload = {
      sub: '1',
      role: 'ADMIN',
    }

    // Mock do usuário admin
    vi.spyOn(prismaService.user, 'findUnique').mockResolvedValueOnce({
      id: '1',
      name: 'Admin User',
      cpf: '12345678901',
      password: 'hashedPassword',
      role: 'ADMIN',
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Mock do destinatário existente
    vi.spyOn(prismaService.recipient, 'findUnique').mockResolvedValueOnce({
      id: '2',
      name: 'João Silva',
      cpf: '123.456.789-00',
      address: 'Rua das Flores, 123, Centro, São Paulo, SP',
      latitude: -23.55052,
      longitude: -46.633308,
    })

    // Mock do findMany do delivery para retornar entregas associadas
    vi.spyOn(prismaService.delivery, 'findMany').mockResolvedValueOnce([
      {
        id: '1',
        recipientId: '2',
        status: 'AGUARDANDO',
        photoUrl: 'url da foto',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])

    // Verifica se a exceção é lançada
    await expect(controller.handle(userPayload, '2')).rejects.toThrowError(
      new NotFoundException(
        'Usuário não pode ser deletado pois tem encomendas associadas',
      ),
    )

    // Verifica se o método findMany foi chamado corretamente
    expect(prismaService.delivery.findMany).toHaveBeenCalledWith({
      where: { recipientId: '2' },
    })
  })
})
