import { Injectable } from "@nestjs/common"
import type { CreateSeriesDto } from "./dto/create-series.dto"
import type { UpdateSeriesDto } from "./dto/update-series.dto"
import type { SeriesRepository } from "./series.repository"

@Injectable()
export class SeriesService {
	constructor(private seriesRepository: SeriesRepository) {}

	async create(createSeriesDto: CreateSeriesDto) {
		return await this.seriesRepository.createSeries(createSeriesDto)
	}

	async findAll() {
		return await this.seriesRepository.findAll()
	}

	async findOne(id: number) {
		return await this.seriesRepository.findOne(id)
	}

	async update(id: number, updateSeriesDto: UpdateSeriesDto) {
		return await this.seriesRepository.update(id, updateSeriesDto)
	}

	remove(id: number) {
		return this.seriesRepository.delete(id)
	}
}
