import { api, dcm2multipart, extractStudyId } from './utils.js';
import axios from 'axios';
import tags from './tags.js';

/**
 * Uploads DICOM studies to PACS server.
 *
 * @param {string[]} files - The DICOM files to upload.
 * @returns {Promise<string[]>} A promise that resolves with the ids of the uploaded studies.
 */
export const uploadDicomStudies = async (files) => {
	try {
		const formData = await dcm2multipart(files);

		const headers = {
			Accept: 'application/dicom+json',
			'Content-Type': `multipart/related; type="application/dicom"; boundary=${formData.getBoundary()}`,
		};

		const response = await axios.post(api('/studies'), formData, { headers });

		// Extract the study retrieve URLs from the response.
		const retrieveUrls = response.data?.[tags.RETRIEVE_URL].Value ?? [];

		return retrieveUrls.map(extractStudyId).filter(Boolean);
	} catch (e) {
		console.debug('Failed to upload DICOM studies:', e.response.data);
		throw new Error(e.response.data?.Message ?? 'Unknown error');
	}
};
