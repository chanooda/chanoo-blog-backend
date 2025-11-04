const checkFileNameReg = /\.[^/.]+$/
const checkFileNumberReg = /(\(\d+\))$/
export const getFileNumber = (fileName: string) =>
	fileName.match(checkFileNumberReg)?.[0]
export const getExtension = (fileName: string) =>
	fileName.match(checkFileNameReg)

export const getFileName = (fileName: string) => {
	return fileName
		.replace(checkFileNameReg, "")
		.trim()
		.replace(getFileNumber(fileName) || "", "")
}
