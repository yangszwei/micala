import { exec } from 'child_process';
import fs from 'fs/promises';

/**
 * Convert the specified DICOM file to JSON via 'dcm2json' command.
 *
 * @param {string} dcmFile - The path to the DICOM file.
 * @param {string} jsonFile - The path to the JSON file to create.
 * @param {ConvertOptions} opts - The options for the conversion.
 * @returns {Promise<void>}
 */
const dcm2json = async (dcmFile, jsonFile, opts = {}) => {
	const result = await new Promise((resolve, reject) => {
		exec(`dcm2json ${dcmFile} ${jsonFile}`, (error) => {
			if (error) {
				return reject(error);
			}
			return resolve();
		});
	});

	if (!opts.includePixelData) {
		const data = await fs.readFile(jsonFile, 'utf8');

		// Remove the binary data from the JSON files. (7FE00010: Pixel Data)
		const dicomJson = JSON.parse(data);
		if (dicomJson?.['7FE00010']?.['InlineBinary']) {
			delete dicomJson['7FE00010']['InlineBinary'];
		}

		await fs.writeFile(jsonFile, JSON.stringify(dicomJson));
	}

	return result;
};

export default dcm2json;
