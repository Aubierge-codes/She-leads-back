import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

const PLACEHOLDER_JWT_SECRET = 'change-this-to-a-long-random-string';
const isProduction = process.env.NODE_ENV === 'production';

// Anyone who knows the JWT secret can forge an admin token, so production must
// never boot with a missing, placeholder, or short secret.
function checkJwtSecret() {
  const secret = process.env.JWT_SECRET ?? '';
  const weak = secret.length < 32 || secret === PLACEHOLDER_JWT_SECRET;
  if (!weak) return;

  const message =
    'JWT_SECRET is missing, the placeholder value, or shorter than 32 characters.';
  if (isProduction) {
    throw new Error(`${message} Refusing to start in production.`);
  }
  new Logger('Bootstrap').warn(`${message} Fine for local dev only.`);
}

// FRONTEND_URL may hold several comma-separated origins. In production with
// FRONTEND_URL set, only those websites may call the API from a browser.
// Otherwise every origin is allowed (local development, or a deploy that has
// not been configured yet, which logs a warning).
function buildCorsOrigin(): (
  origin: string | undefined,
  callback: (err: Error | null, allow?: boolean) => void,
) => void {
  const allowed = (process.env.FRONTEND_URL ?? '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);
  const restrict = isProduction && allowed.length > 0;

  if (isProduction && !restrict) {
    new Logger('Bootstrap').warn(
      'FRONTEND_URL is not set: accepting browser requests from ANY website. Set it to the public frontend URL.',
    );
  }

  return (origin, callback) => {
    // No Origin header = not a browser (curl, server-to-server, health checks).
    if (!restrict || !origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  };
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  checkJwtSecret();

  // Behind a hosting platform's load balancer every request appears to come
  // from the proxy. TRUST_PROXY=1 tells Express to use the real client IP
  // (needed for the login rate limit to work per person, not per platform).
  if (process.env.TRUST_PROXY) {
    app.set('trust proxy', Number(process.env.TRUST_PROXY));
  }

  app.enableCors({ origin: buildCorsOrigin(), credentials: true });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // The interactive API docs list every endpoint, so they stay off in
  // production unless deliberately enabled.
  if (!isProduction || process.env.ENABLE_SWAGGER === 'true') {
    const config = new DocumentBuilder()
      .setTitle('ECO GIRLS COLLECTIVE Impact Dashboard API')
      .setDescription(
        'API for managing participants, schools, cleanups, inventory, clubs, and reports',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('api', app, SwaggerModule.createDocument(app, config));
  }

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
