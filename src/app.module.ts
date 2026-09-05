import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { CommunitiesModule } from './communities/communities.module';
import { SchoolsModule } from './schools/schools.module';
import { ParticipantsModule } from './participants/participants.module';
import { CleanupModule } from './cleanup/cleanup.module';
import { InventoryModule } from './inventory/inventory.module';
import { ClubsModule } from './clubs/clubs.module';
import { ReportsModule } from './reports/reports.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { DonationsModule } from './donations/donations.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    CommunitiesModule,
    SchoolsModule,
    ParticipantsModule,
    CleanupModule,
    InventoryModule,
    ClubsModule,
    ReportsModule,
    DonationsModule,
    AnalyticsModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
