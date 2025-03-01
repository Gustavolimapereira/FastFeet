import { Module } from '@nestjs/common'
import { PrismaService } from './prisma/prisma.service'
import { ConfigModule } from '@nestjs/config'
import { envSchema } from './env'
import { AuthModule } from './auth/auth.module'
import { CreateDeliverysController } from './controller/deliverys/create-delivery.controller'
import { UpdateDeliveryController } from './controller/deliverys/update-delivery.controller'
import { ListDeliveryController } from './controller/deliverys/list-delivery.controller'
import { DeleteDeliveryController } from './controller/deliverys/delete-delivery.controller'
import { MarkDeliveryAvailableController } from './controller/deliverys/waiting-update-delivery.controller'
import { MarkDeliveryWitchDrawController } from './controller/deliverys/withdraw-delivery.controller'
import { NotificationService } from './controller/notification/notification-service.controller'
import { UserModule } from './controller/users/user.module'
import { RecipientModule } from './controller/recipients/recipients.module'

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (env) => envSchema.parse(env),
      isGlobal: true,
    }),
    AuthModule,
    UserModule,
    RecipientModule,
  ],
  controllers: [
    CreateDeliverysController,
    UpdateDeliveryController,
    ListDeliveryController,
    DeleteDeliveryController,
    MarkDeliveryAvailableController,
    MarkDeliveryWitchDrawController,
  ],
  providers: [PrismaService, NotificationService],
})
export class AppModule {}

// ultimo arquivo visto foi o 16
