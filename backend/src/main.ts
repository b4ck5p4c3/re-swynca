import {NestFactory} from '@nestjs/core';
import {AppModule} from './app.module';
import {DocumentBuilder, SwaggerModule} from "@nestjs/swagger";
import {ValidationPipe} from "@nestjs/common";
import * as cookieParser from "cookie-parser";
import {promises as fsPromises} from "fs";
import * as path from "path";
import {SESSION_COOKIE_NAME} from "./auth/auth.service";

async function bootstrap() {
    const app = await NestFactory.create(AppModule, process.env.NODE_ENV === "development" ? {
        cors: {
            allowedHeaders: ["Cookie", "Content-Type"],
            credentials: true,
            origin: "http://localhost:3000",
        }
    } : undefined);

    app.use(cookieParser());
    app.setGlobalPrefix("api");
    app.useGlobalPipes(new ValidationPipe());

    const config = new DocumentBuilder()
        .setTitle("RE: Swynca")
        .setDescription('B4CKSP4CE member/money management system')
        .setVersion('1.0')
        .addCookieAuth(SESSION_COOKIE_NAME)
        .build();
    const document = SwaggerModule.createDocument(app, config);

    if (process.env.NODE_ENV === "development") {
        await fsPromises.writeFile(path.join(process.cwd(), "openapi.json"), JSON.stringify(document, null, 4));
    }

    SwaggerModule.setup('swagger', app, document, {
        useGlobalPrefix: true
    });

    await app.listen(3001);
}

bootstrap();
