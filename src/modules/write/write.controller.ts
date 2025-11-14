import {
	Body,
	Controller,
	Delete,
	Get,
	HttpStatus,
	Param,
	Patch,
	Post,
	Query,
	UseGuards,
	UseInterceptors,
	UsePipes,
} from "@nestjs/common"
import { NoFilesInterceptor } from "@nestjs/platform-express"
import {
	ApiBearerAuth,
	ApiConsumes,
	ApiOkResponse,
	ApiOperation,
	ApiTags,
} from "@nestjs/swagger"
import { CommonResponse, IdReq, IdRes } from "src/common/dto/response.dto"
import { AuthGuard } from "src/modules/auth/auth.guard"
import { PlainTextPipe } from "src/pipe/plain-text.pipe"
import { CreateWriteDto } from "./dto/create-write.dto"
import { WriteFindAllDto } from "./dto/find-write.dto"
import {
	GetWriteDto,
	GetWritesDto,
	type WriteFullResDto,
} from "./dto/response-write.dto"
import { UpdateWriteDto } from "./dto/update-write.dto"
import { WriteService } from "./write.service"

@ApiTags("write")
@Controller("write")
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class WriteController {
	constructor(private readonly writeService: WriteService) {}

	@ApiOperation({ summary: "글 생성하기 (관리자 전용)" })
	@ApiConsumes("multipart/form-data")
	@Post()
	@UseInterceptors(NoFilesInterceptor())
	@UsePipes(PlainTextPipe)
	async create(
		@Body() createWriteDto: CreateWriteDto
	): Promise<CommonResponse<IdRes>> {
		const id = await this.writeService.create(createWriteDto)
		return {
			status: HttpStatus.OK,
			data: id,
		}
	}

	@ApiOperation({ summary: "글 수정하기 (관리자 전용)" })
	@ApiConsumes("multipart/form-data")
	@Patch(":id")
	@UseInterceptors(NoFilesInterceptor())
	@UsePipes(PlainTextPipe)
	update(
		@Param("id") id: string,
		@Body() updateWriteDto: UpdateWriteDto
	): Promise<IdRes> {
		return this.writeService.update(+id, updateWriteDto)
	}

	@ApiOperation({ summary: "글 모두 가져오기 (관리자 전용)" })
	@ApiOkResponse({
		type: GetWritesDto,
	})
	@Get()
	async findAll(
		@Query() writeFindAllDto: WriteFindAllDto
	): Promise<CommonResponse<WriteFullResDto[]>> {
		const writes = await this.writeService.findAll(writeFindAllDto)
		return {
			status: HttpStatus.OK,
			data: writes,
		}
	}

	@Get(":id")
	@ApiOperation({ summary: "글 가져오기 (관리자 전용)" })
	@ApiOkResponse({
		type: GetWriteDto,
	})
	async findOne(
		@Param() { id }: IdReq
	): Promise<CommonResponse<WriteFullResDto>> {
		const write = await this.writeService.findOne(+id)
		return {
			status: HttpStatus.OK,
			data: write,
		}
	}

	@Delete(":id")
	@ApiOperation({ summary: "글 삭제하기 (관리자 전용)" })
	async remove(@Param() { id }: IdReq) {
		await this.writeService.remove(+id)

		return {
			status: HttpStatus.OK,
		}
	}

	@Get("/id-list")
	@ApiOperation({ summary: "글 ID 목록 가져오기 (관리자 전용)" })
	async writeIdList() {
		return {
			status: HttpStatus.OK,
			data: await this.writeService.writeIdList(),
		}
	}
}
