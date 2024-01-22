import { execFile } from 'child_process';

/**
 * Converts the given DICOM file to a JPEG thumbnail.
 *
 * @param {string} dcmFile - The path to the DICOM file to convert.
 * @param {string} jpegFile - The path to the JPEG file to create.
 * @returns {Promise<void>}
 */
export const dcm2jpeg = (dcmFile, jpegFile) => {
	return new Promise((resolve, reject) => {
		execFile('dcmj2pnm', ['--write-jpeg', '--min-max-window', dcmFile, jpegFile], (error) => {
			if (error) {
				reject(error);
			}
			resolve();
		});
	});
};
