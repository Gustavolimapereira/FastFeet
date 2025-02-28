import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async notifyRecipient(
    deliveryId: string,
    recipientId: string,
    message: string,
  ) {
    return await this.prisma.notification.create({
      data: {
        deliveryId,
        recipientId,
        message,
      },
    })
  }
}
