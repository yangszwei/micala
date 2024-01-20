import FormData from 'form-data';
import fs from 'fs';

/**
 * Constructs the API URL for DICOM web server.
 *
 * @param {string} path - The path to append to the base URL.
 * @returns {string} The constructed API URL.
 */
export const api = (path) => {
	const baseUrl = process.env.DICOMWEB_URL ?? 'http://localhost:8081/dicom-web';
	return new URL(path.replace(/^\//, './'), baseUrl.replace(/\/?$/, '/')).toString();
};

/**
 * Converts DICOM files to multipart form data.
 *
 * @param {string[]} paths - The paths of the DICOM files.
 * @returns {Promise<FormData>} A promise that resolves with the multipart form data.
 */
export const dcm2multipart = async (paths) => {
	const formData = new FormData();
	for (const path of paths) {
		const stream = await fs.createReadStream(path);
		formData.append('file', stream, {
			filename: path,
			contentType: 'application/dicom',
			knownLength: fs.statSync(path).size,
		});
	}
	return formData;
};

/**
 * Extracts the study ID from the given URL.
 *
 * @param {string} url - The URL to extract the study ID from.
 * @returns {string} The extracted study ID.
 */
export const extractStudyId = (url) => {
	return url.match(/\/studies\/([^/]+)/)?.[1] ?? '';
};
