import {
	Body,
	Controller,
	Delete,
	Get,
	HttpStatus,
	Param,
	Patch,
	Post,
} from "@nestjs/common"
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger"
import type { CommonResponse } from "src/common/dto/response.dto"
import type { CreateTagDto } from "./dto/create-tag.dto"
import {
	GetTagsResDto,
	GetTagWithWriteResDto,
	type TagResDto,
} from "./dto/response-tag.dto"
import type { UpdateTagDto } from "./dto/update-tag.dto"
import type { TagService } from "./tag.service"

@ApiTags("tag")
@Controller("tag")
export class TagController {
	constructor(private readonly tagService: TagService) {}

	@ApiOperation({ summary: "태그 생성" })
	@ApiOkResponse({
		type: GetTagsResDto,
	})
	@Post()
	create(@Body() createTagDto: CreateTagDto) {
		return this.tagService.create(createTagDto)
	}

	@ApiOperation({ summary: "태그 모두 가져오기" })
	@ApiOkResponse({
		type: GetTagsResDto,
	})
	@Get()
	async findAll(): Promise<CommonResponse<TagResDto[]>> {
		const tags = await this.tagService.findAll()
		return {
			data: tags,
			status: HttpStatus.OK,
		}
	}

	@ApiOperation({ summary: "태그별 글 가져오기" })
	@ApiOkResponse({
		type: GetTagWithWriteResDto,
	})
	@Get(":id")
	findOneWithWrite(@Param("id") id: string) {
		return this.tagService.findOneWithWrite(+id)
	}

	@ApiOperation({ summary: "태그 수정하기" })
	@ApiOkResponse({
		type: GetTagsResDto,
	})
	@Patch(":id")
	update(@Param("id") id: string, @Body() updateTagDto: UpdateTagDto) {
		return this.tagService.update(+id, updateTagDto)
	}

	@ApiOperation({ summary: "태그 지우기" })
	@Delete(":id")
	remove(@Param("id") id: string) {
		return this.tagService.remove(+id)
	}
}
