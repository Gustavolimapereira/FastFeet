import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard'
import { PrismaService } from 'src/prisma/prisma.service'

@Controller('/delivery/nearby')
@UseGuards(JwtAuthGuard)
export class NearbyDeliveriesController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async handle(
    @Query('lat') latitude: string,
    @Query('lng') longitude: string,
  ) {
    const lat = parseFloat(latitude)
    const lng = parseFloat(longitude)

    if (isNaN(lat) || isNaN(lng)) {
      throw new Error('Latitude e Longitude inválidas')
    }

    const deliveries = await this.prisma.$queryRaw`
      SELECT d.*, r.latitude, r.longitude,
        (6371 * ACOS(
          COS(RADIANS(${lat})) * COS(RADIANS(r.latitude)) *
          COS(RADIANS(r.longitude) - RADIANS(${lng})) +
          SIN(RADIANS(${lat})) * SIN(RADIANS(r.latitude))
        )) AS distance
      FROM "Delivery" d
      INNER JOIN "Recipient" r ON d."recipientId" = r.id
      WHERE d.status = 'AGUARDANDO'
      HAVING distance < 10
      ORDER BY distance ASC
    `

    return {
      deliveries,
    }
  }
}
