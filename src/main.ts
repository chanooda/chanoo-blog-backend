import { ValidationPipe } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import { AppModule } from "./modules/app/app.module"

async function bootstrap() {
	const app = await NestFactory.create(AppModule, {
		cors: true,
	})

	app.setGlobalPrefix("api")

	app.useGlobalPipes(new ValidationPipe({ transform: true }))

	const config = new DocumentBuilder()
		.setTitle("chanoo blog")
		.setDescription("chanoo blog api docs")
		.setVersion("0.1")
		.build()

	const document = SwaggerModule.createDocument(app, config)
	SwaggerModule.setup("api", app, document)

	await app.listen(4000)
}
bootstrap()
