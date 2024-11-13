import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { join } from 'path';

@Module({
  imports: [
    // Load .env configuration globally
    ConfigModule.forRoot({ isGlobal: true }),

    // Database configuration using environment variables
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
        synchronize: true, // Disable in production
      }),
    }),

    // Mailer configuration using environment variables
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('EMAIL_HOST'), // e.g., smtp.gmail.com
          port: configService.get<number>('EMAIL_PORT'), // e.g., 587
          secure: false, // true for 465, false for other ports
          auth: {
            user: configService.get<string>('EMAIL_USER'), // Email address
            pass: configService.get<string>('EMAIL_PASS'), // App password
          },
        },
        defaults: {
          from: configService.get<string>('EMAIL_SENDER'), // Default sender email
        },
        template: {
          // Ensure templates are correctly located regardless of the build environment
          dir: join(process.cwd(), 'src', 'templates'), // Use absolute path to src/templates
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),

    // Import other application modules
    UsersModule,
    AuthModule,
  ],
})
export class AppModule {}
