import {
	type ArgumentMetadata,
	Injectable,
	type PipeTransform,
} from "@nestjs/common"

@Injectable()
export class PlainTextPipe implements PipeTransform {
	transform(value: any, _metadata: ArgumentMetadata) {
		const removeMarkdown = require("remove-markdown")
		if (value && typeof value === "object") {
			if (value.content) {
				value.plainText = removeMarkdown(value.content)
			}
		}
		return value
	}
}
