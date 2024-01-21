import { api } from './utils.js';
import tags from '#lib/dicom-web/tags.js';

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
