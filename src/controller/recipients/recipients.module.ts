import { Module } from '@nestjs/common'

import { PrismaService } from 'src/prisma/prisma.service'
import { UpdateRecipientController } from './update-recipient.controller'
import { CreateRecipientsController } from './create-recipient.controller'
import { DeleteRecipientController } from './delete-recipient.controller'
import { ListRecipientController } from './list-recipient.controller'

@Module({
  controllers: [
    CreateRecipientsController,
    UpdateRecipientController,
    DeleteRecipientController,
    ListRecipientController,
  ],
  providers: [PrismaService],
})
export class RecipientModule {}
