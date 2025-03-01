import { PrismaService } from 'src/prisma/prisma.service'
import { ListDeliveryController } from './list-delivery.controller'
import { CreateDeliverysController } from './create-delivery.controller'
import { DeleteDeliveryController } from './delete-delivery.controller'
import { UpdateDeliveryController } from './update-delivery.controller'
import { Module } from '@nestjs/common'

@Module({
  controllers: [
    CreateDeliverysController,
    UpdateDeliveryController,
    ListDeliveryController,
    DeleteDeliveryController,
  ],
  providers: [PrismaService],
})
export class DeliveryModule {}
