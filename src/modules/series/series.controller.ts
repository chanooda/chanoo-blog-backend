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
import { CommonResponse } from "src/common/dto/response.dto"
import { CreateSeriesDto } from "./dto/create-series.dto"
import {
	GetSeriesAllDto,
	GetSeriesDto,
	type SeriesResDto,
} from "./dto/response-series.dto"
import { UpdateSeriesDto } from "./dto/update-series.dto"
import { SeriesService } from "./series.service"

@ApiTags("series")
@Controller("series")
export class SeriesController {
	constructor(private readonly seriesService: SeriesService) {}

	@ApiOperation({ summary: "시리즈 생성" })
	@ApiOkResponse({
		type: GetSeriesDto,
	})
	@Post()
	async create(
		@Body() createSeriesDto: CreateSeriesDto
	): Promise<CommonResponse<SeriesResDto>> {
		const series = await this.seriesService.create(createSeriesDto)
		return {
			status: HttpStatus.OK,
			data: series,
		}
	}

	@ApiOperation({ summary: "시리즈 모두 가져오기" })
	@ApiOkResponse({
		type: GetSeriesAllDto,
	})
	@Get()
	async findAll(): Promise<CommonResponse<SeriesResDto[]>> {
		const series = await this.seriesService.findAll()
		return {
			status: HttpStatus.OK,
			data: series,
		}
	}

	@ApiOperation({ summary: "시리즈 개별 가져오기" })
	@ApiOkResponse({
		type: GetSeriesDto,
	})
	@Get(":id")
	async findOne(@Param("id") id: string): Promise<CommonResponse<SeriesResDto>> {
		const series = await this.seriesService.findOne(+id)
		return {
			status: HttpStatus.OK,
			data: series,
		}
	}

	@ApiOperation({ summary: "시리즈 수정하기" })
	@ApiOkResponse({
		type: GetSeriesDto,
	})
	@Patch(":id")
	async update(
		@Param("id") id: string,
		@Body() updateSeriesDto: UpdateSeriesDto
	): Promise<CommonResponse<SeriesResDto>> {
		const series = await this.seriesService.update(+id, updateSeriesDto)
		return {
			status: HttpStatus.OK,
			data: series,
		}
	}

	@ApiOperation({ summary: "시리즈 삭제하기" })
	@Delete(":id")
	async remove(@Param("id") id: string): Promise<CommonResponse<undefined>> {
		await this.seriesService.remove(+id)
		return {
			status: HttpStatus.OK,
		}
	}
}
