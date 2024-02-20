import { api } from './utils.js';
import tags from '#lib/dicom-web/tags.js';

/**
 * @param {ManageStudiesQuery} query
 * @returns {Promise<any | any[]>}
 */
export const queryStudies = async (query) => {
	const params = new URLSearchParams();
	if (query.patientId) params.set(tags.PATIENT_ID, query.patientId);
	if (query.patientName) params.set(tags.PATIENT_NAME, query.patientName);
	if (query.modality) params.set(tags.MODALITY, query.modality);
	if (query.identifier) params.set(tags.STUDY_INSTANCE_UID, query.identifier);

	console.log(api('/studies') + '?' + params.toString());

	const response = await fetch(api('/studies') + '?' + params.toString());
	if (response.status === 204) {
		return [];
	} else if (response.status !== 200) {
		throw new Error(`Failed to fetch studies: ${response.status} ${await response.text()}`);
	}

	let studies = await response.json();
	if (!Array.isArray(studies)) {
		console.debug('Failed to parse studies: ', studies);
		return [];
	}

	if (query.fromDate || query.toDate) {
		studies = studies.filter((study) => {
			const studyDate = new Date(study[tags.STUDY_DATE]?.Value[0]);
			return (!query.fromDate || studyDate >= query.fromDate) && (!query.toDate || studyDate <= query.toDate);
		});
	}

	return studies.map((study) => ({
		studyDate: study[tags.STUDY_DATE]?.Value[0] ?? '',
		description: study[tags.STUDY_DESCRIPTION]?.Value[0] ?? '',
		patientName: study[tags.PATIENT_NAME]?.Value[0] ?? '',
		patientId: study[tags.PATIENT_ID]?.Value[0] ?? '',
		studyUid: study[tags.STUDY_INSTANCE_UID]?.Value[0] ?? '',
		retrieveUrl: study[tags.RETRIEVE_URL]?.Value[0] ?? '',
	}));
};

/**
 * Gets the series UIDs for a given study UID.
 *
 * @param {string} studyUid - The study UID.
 * @returns {Promise<string[]>} A promise that resolves to an array of series UIDs.
 * @throws {Error} If the fetch operation fails.
 */
export const getSeriesUids = async (studyUid) => {
	const response = await fetch(api(studyUid) + '/series');
	if (response.status !== 200) {
		throw new Error('Failed to fetch series');
	}

	const series = await response.json();
	if (!Array.isArray(series)) {
		console.debug('Failed to parse series: ', series);
		return [];
	}

	return series.map((series) => series[tags.SERIES_INSTANCE_UID].Value[0]);
};

/**
 * Gets the instance UIDs for a given study UID and series UID.
 *
 * @param {string} studyUid - The study UID.
 * @param {string} seriesUid - The series UID.
 * @throws {Error} If the fetch operation fails.
 */
export const getInstanceUids = async (studyUid, seriesUid) => {
	const response = await fetch(api(studyUid, seriesUid) + '/instances');
	if (response.status !== 200) {
		throw new Error('Failed to fetch instances');
	}

	const instance = await response.json();
	if (!Array.isArray(instance)) {
		console.debug('Failed to parse instance: ', instance);
		return [];
	}

	return instance.map((item) => item[tags.SOP_INSTANCE_UID].Value[0]);
};
