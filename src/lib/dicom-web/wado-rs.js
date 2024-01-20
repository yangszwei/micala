import JSZip from 'jszip';
import { api } from './utils.js';
import fs from 'fs';
import path from 'path';

/**
 * Ensures the directory containing the given file exists.
 *
 * @param {string} filepath - The path to the file.
 * @returns {void}
 */
const ensureDirSync = (filepath) => {
	fs.mkdirSync(path.dirname(filepath), { recursive: true });
};

/**
 * Fetches a study from the PACS server and extract it to the data directory.
 *
 * @param {string} id - The ID of the study to fetch.
 * @returns {Promise<string[]>} A promise that resolves with the paths of the fetched files.
 */
export const fetchStudyAsZip = async (id) => {
	const response = await fetch(api(`/studies/${id}`), { headers: { Accept: 'application/zip' } });
	if (response.status !== 200) {
		throw new Error('Failed to fetch study');
	}

	const buffer = await response.arrayBuffer();

	const zip = await JSZip.loadAsync(buffer);

	// The paths to the saved files.
	const savedFiles = [];

	// Save the files to the data directory.
	for (const file of Object.values(zip.files)) {
		const filepath = path.resolve('./data/temp', file.name);
		ensureDirSync(filepath);

		const buffer = await file.async('nodebuffer');
		fs.writeFileSync(filepath, buffer);

		savedFiles.push(filepath);
	}

	return savedFiles;
};
