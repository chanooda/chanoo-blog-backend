import { Injectable } from "@nestjs/common"
import { IdRes } from "src/common/dto/response.dto"
import { CreateWriteDto } from "./dto/create-write.dto"
import { PublicWriteFindAllDto } from "./dto/find-public-write.dto"
import { WriteFindAllDto } from "./dto/find-write.dto"
import { UpdateWriteDto } from "./dto/update-write.dto"
import { WriteRepository } from "./write.repository"

@Injectable()
export class WriteService {
	constructor(private writeRepository: WriteRepository) {}

	async create(createWriteDto: CreateWriteDto): Promise<IdRes> {
		return await this.writeRepository.create(createWriteDto)
	}

	async findAll(writeFindAllDto: WriteFindAllDto) {
		return await this.writeRepository.findAll(writeFindAllDto)
	}

	async findOne(id: number) {
		return await this.writeRepository.findOne(id)
	}

	async update(id: number, updateWriteDto: UpdateWriteDto) {
		return await this.writeRepository.update(id, updateWriteDto)
	}

	async remove(id: number) {
		return await this.writeRepository.delete(id)
	}

	async writeIdList() {
		return await this.writeRepository.writeIdList()
	}

	async findAllPublic(publicWriteFindAllDto: PublicWriteFindAllDto) {
		return await this.writeRepository.findAllPublic(publicWriteFindAllDto)
	}

	async findOnePublic(id: number) {
		return await this.writeRepository.findOnePublic(id)
	}
}
