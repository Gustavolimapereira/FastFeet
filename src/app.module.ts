import { Module } from '@nestjs/common'
import { PrismaService } from './prisma/prisma.service'
import { ConfigModule } from '@nestjs/config'
import { envSchema } from './env'
import { AuthModule } from './auth/auth.module'
import { MarkDeliveryAvailableController } from './controller/deliverys/waiting-update-delivery.controller'
import { MarkDeliveryWitchDrawController } from './controller/deliverys/withdraw-delivery.controller'
import { NotificationService } from './controller/notification/notification-service.controller'
import { UserModule } from './controller/users/user.module'
import { RecipientModule } from './controller/recipients/recipients.module'
import { DeliveryModule } from './controller/deliverys/delivery crud/delivery.module'
import { MarkDeliveryCompletedController } from './controller/deliverys/completed-delivery.controller'
import { MarkDeliveryReturnedController } from './controller/deliverys/returned-delivery.controller'
import { ListDeliveryByUserController } from './controller/deliverys/list-delivery-by-user.controller'
import { NearbyDeliveriesController } from './controller/deliverys/near-delivery.controller'

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (env) => envSchema.parse(env),
      isGlobal: true,
    }),
    AuthModule,
    UserModule,
    RecipientModule,
    DeliveryModule,
  ],
  controllers: [
    MarkDeliveryAvailableController,
    MarkDeliveryWitchDrawController,
    MarkDeliveryCompletedController,
    MarkDeliveryReturnedController,
    ListDeliveryByUserController,
    NearbyDeliveriesController,
  ],
  providers: [PrismaService, NotificationService],
})
export class AppModule {}

// ultimo arquivo visto foi o 16
