import { Module } from '@nestjs/common'
import { CreateAccountController } from './create-account.controller'
import { AuthenticateController } from '../authenticate.controller'
import { UpdateAccountController } from './update-account.controller'
import { DeleteAccountController } from './delete-account.controller'
import { ListAccountController } from './list-account.controller'
import { PrismaService } from 'src/prisma/prisma.service'

@Module({
  controllers: [
    CreateAccountController,
    AuthenticateController,
    UpdateAccountController,
    DeleteAccountController,
    ListAccountController,
  ],
  providers: [PrismaService],
})
export class UserModule {}
