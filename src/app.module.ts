import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
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
import { NewsletterModule } from './newsletter/newsletter.module';
import { PartnershipsModule } from './partnerships/partnerships.module';
import { PublicModule } from './public/public.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Limits are only enforced where ThrottlerGuard is applied (the login
    // route). LOGIN_RATE_LIMIT = attempts per minute per IP address.
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        { ttl: 60_000, limit: Number(config.get('LOGIN_RATE_LIMIT') ?? 10) },
      ],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CommunitiesModule,
    SchoolsModule,
    ParticipantsModule,
    CleanupModule,
    InventoryModule,
    ClubsModule,
    ReportsModule,
    DonationsModule,
    NewsletterModule,
    PartnershipsModule,
    PublicModule,
    AnalyticsModule,
    DashboardModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
