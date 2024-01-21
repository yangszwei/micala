import FormData from 'form-data';
import fs from 'fs';

/**
 * Constructs the API URL for DICOM web server.
 *
 * @param {string} pathname - The DICOM web path, or study UID if it doesn't start with a slash.
 * @param {string} [seriesUid] - (Optional) The series UID, only used if the first argument is a study UID.
 * @param {string} [instanceUid] - (Optional) The instance UID, only used if the first argument is a study UID.
 * @returns {string} The constructed API URL.
 */
export const api = (pathname, seriesUid, instanceUid) => {
	const baseUrl = process.env.DICOMWEB_URL ?? 'http://localhost:8081/dicom-web';

	if (!pathname.startsWith('/')) {
		pathname = `/studies/${pathname}`;
		if (seriesUid) pathname += `/series/${seriesUid}`;
		if (instanceUid) pathname += `/instances/${instanceUid}`;
	}

	return new URL(pathname.replace(/^\//, './'), baseUrl.replace(/\/?$/, '/')).toString();
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
