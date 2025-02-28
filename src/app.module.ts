import { Module } from '@nestjs/common'
import { PrismaService } from './prisma/prisma.service'
import { CreateAccountController } from './controller/users/create-account.controller'
import { ConfigModule } from '@nestjs/config'
import { envSchema } from './env'
import { AuthModule } from './auth/auth.module'
import { AuthenticateController } from './controller/authenticate-controller'
import { UpdateAccountController } from './controller/users/update-account.controller'
import { DeleteAccountController } from './controller/users/delete-account.controller'
import { ListAccountController } from './controller/users/list-account-controller'
import { CreateRecipientsController } from './controller/recipients/create-recipient.controller'
import { UpdateRecipientController } from './controller/recipients/update-recipient.controller'
import { DeleteRecipientController } from './controller/recipients/delete-recipient.controller'
import { ListRecipientController } from './controller/recipients/list-recipient.controller'
import { CreateDeliverysController } from './controller/deliverys/create-delivery.controller'
import { UpdateDeliveryController } from './controller/deliverys/update-delivery.controller'
import { ListDeliveryController } from './controller/deliverys/list-delivery.controller'
import { DeleteDeliveryController } from './controller/deliverys/delete-delivery.controller'
import { MarkDeliveryAvailableController } from './controller/deliverys/waiting-update-delivery.controller'
import { MarkDeliveryWitchDrawController } from './controller/deliverys/withdraw-delivery.controller'
import { NotificationService } from './controller/notification/notification-service.controller'

@Module({
  imports: [
    ConfigModule.forRoot({
      validate: (env) => envSchema.parse(env),
      isGlobal: true,
    }),
    AuthModule,
  ],
  controllers: [
    CreateAccountController,
    AuthenticateController,
    UpdateAccountController,
    DeleteAccountController,
    ListAccountController,
    CreateRecipientsController,
    UpdateRecipientController,
    DeleteRecipientController,
    ListRecipientController,
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
