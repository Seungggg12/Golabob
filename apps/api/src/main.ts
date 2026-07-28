import { config } from "dotenv";
import { NestFactory } from "@nestjs/core";
import {
  DocumentBuilder,
  SwaggerModule,
} from "@nestjs/swagger";
import express from "express";
import { AppModule } from "./app.module";
import { DbService } from "./shared/db.service";

config({
  path: `${__dirname}/../.env`,
});

async function bootstrap() {
  const app =
    await NestFactory.create(AppModule, {
      bodyParser: false,
    });

  app.use(
    express.json({
      limit: "10mb",
    }),
  );

  app.use(
    express.urlencoded({
      extended: true,
      limit: "10mb",
    }),
  );

  app.setGlobalPrefix("api");
  app.enableCors();

  const swaggerConfig =
    new DocumentBuilder()
      .setTitle("Golabob API")
      .setDescription(
        "Golabob 서비스 API 문서",
      )
      .setVersion("0.1.0")
      .addBearerAuth()
      .build();

  const swaggerDocument =
    SwaggerModule.createDocument(
      app,
      swaggerConfig,
    );

  SwaggerModule.setup(
    "api/docs",
    app,
    swaggerDocument,
  );

  const dbService =
    app.get(DbService);

  await dbService.init();

  const port =
    process.env.PORT || 3000;

  await app.listen(port);

  console.log(
    `Golabob API server is running on http://localhost:${port}`,
  );
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});