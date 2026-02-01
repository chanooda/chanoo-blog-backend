import { ValidationPipe } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import { HttpExceptionFilter } from "./common/filter/http-exception.filter"
import { AppModule } from "./modules/app/app.module"

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		cors: {
			origin: [
				...(process.env.NODE_ENV === "production"
					? ["https://admin.chanoo.dev", "https://service.chanoo.dev"]
					: ["http://localhost:3000", "http://localhost:3001"]),
			],
			credentials: true,
		},
	})

	app.setGlobalPrefix("api")

	app.useGlobalPipes(new ValidationPipe({ transform: true }))
	app.useGlobalFilters(new HttpExceptionFilter())

	const config = new DocumentBuilder()
		.setTitle("chanoo blog")
		.setDescription("chanoo blog api docs")
		.setVersion("0.1")
		.build()

	const document = SwaggerModule.createDocument(app, config)
	SwaggerModule.setup("docs", app, document)

	await app.listen(4000)
}
bootstrap()
