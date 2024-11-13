import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get<string>('DATABASE_USER'),
        password: configService.get<string>('DATABASE_PASSWORD'),
        database: configService.get<string>('DATABASE_NAME'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),

    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('EMAIL_HOST'), 
          port: configService.get<number>('EMAIL_PORT'), 
          secure: false, 
          auth: {
            user: configService.get<string>('EMAIL_USER'), 
            pass: configService.get<string>('EMAIL_PASS'), 
          },
        },
        defaults: {
          from: configService.get<string>('EMAIL_SENDER'), 
        },
        template: {
          dir: join(process.cwd(), 'src', 'templates'), 
          options: {
            strict: true,
          },
        },
      }),
    }),

    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}
