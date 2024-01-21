import { dirname } from 'path';
import { execFile } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Converts the given DICOM file to a JPEG thumbnail.
 *
 * @param {string} dcmFile - The path to the DICOM file to convert.
 * @param {string} jpegFile - The path to the JPEG file to create.
 * @returns {Promise<void>}
 */
export const dcm2jpeg = (dcmFile, jpegFile) => {
	const dcm2jpeg = path.resolve(__dirname, 'dcm2jpeg.py');
	return new Promise((resolve, reject) => {
		execFile('python3', ['-W', 'ignore', dcm2jpeg, dcmFile, jpegFile], (error) => {
			if (error) {
				reject(error);
			}
			resolve();
		});
	});
};
