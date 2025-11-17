import { Controller, Get, HttpStatus, Param, Query } from "@nestjs/common"
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger"
import { CommonResponse, IdReq } from "src/common/dto/response.dto"
import { PublicWriteFindAllDto } from "./dto/find-public-write.dto"
import {
	GetWriteDto,
	GetWritesDto,
	type WriteFullResDto,
} from "./dto/response-write.dto"
import { WriteService } from "./write.service"

@ApiTags("public-write")
@Controller("public/write")
export class PublicWriteController {
	constructor(private readonly writeService: WriteService) {}

	@ApiOperation({ summary: "공개된 글 목록 가져오기" })
	@ApiOkResponse({
		type: GetWritesDto,
	})
	@Get()
	async findAll(
		@Query() publicWriteFindAllDto: PublicWriteFindAllDto
	): Promise<CommonResponse<WriteFullResDto[]>> {
		const writes = await this.writeService.findAllPublic(publicWriteFindAllDto)
		return {
			status: HttpStatus.OK,
			data: writes,
		}
	}

	@Get(":id")
	@ApiOperation({ summary: "공개된 글 가져오기" })
	@ApiOkResponse({
		type: GetWriteDto,
	})
	async findOne(
		@Param() { id }: IdReq
	): Promise<CommonResponse<WriteFullResDto>> {
		const write = await this.writeService.findOnePublic(+id)
		return {
			status: HttpStatus.OK,
			data: write,
		}
	}
}
