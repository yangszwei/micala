import JSZip from 'jszip';
import { api } from './utils.js';
import { dcm2jpeg } from '#lib/dcm2jpeg/index.js';
import dcm2json from '#lib/dcmtk/dcm2json.js';
import fs from 'fs';
import { joinDataPath } from '#lib/utils/data.js';
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
 * Fetches DICOM files from the PACS server and extract them to the data directory.
 *
 * @param {string} studyUid - The study UID.
 * @param {string} [seriesUid] - (Optional) The series UID.
 * @param {string} [instanceUid] - (Optional) The instance UID.
 * @param {boolean} [dicomOnly=false] - (Optional) Whether to fetch only DICOM files. Default is `false`
 * @returns {Promise<string[]>} A promise that resolves with the paths of the fetched files.
 */
export const fetchDicom = async (studyUid, seriesUid, instanceUid, dicomOnly = false) => {
	const response = await fetch(api(studyUid, seriesUid, instanceUid), { headers: { Accept: 'application/zip' } });
	if (response.status !== 200) {
		throw new Error(`Failed to fetch the DICOM files: (${response.status}) ${await response.text()}`);
	}

	const buffer = await response.arrayBuffer();

	const zip = await JSZip.loadAsync(buffer);

	// The paths to the saved files.
	const savedFiles = [];

	// Save the files to the data directory.
	for (const file of Object.values(zip.files)) {
		if (dicomOnly && !file.name.endsWith('.dcm')) {
			continue;
		}

		const filepath = joinDataPath(`./temp`, file.name);
		ensureDirSync(filepath);

		const buffer = await file.async('nodebuffer');
		fs.writeFileSync(filepath, buffer);

		savedFiles.push(filepath);
	}

	return savedFiles;
};

/**
 * Fetches DICOM files and converts them to JPEG thumbnails.
 *
 * @param {string} studyUid - The study UID.
 * @param {string} [seriesUid] - (Optional) The series UID.
 * @param {string} [instanceUid] - (Optional) The instance UID.
 * @returns {Promise<string[]>} A promise that resolves with the paths of the thumbnails.
 */
export const fetchDicomThumbnail = async (studyUid, seriesUid, instanceUid) => {
	const dcmFiles = await fetchDicom(studyUid, seriesUid, instanceUid, true);
	if (dcmFiles.length === 0) {
		throw new Error(`No DICOM files found.`);
	}

	// The paths to the saved images.
	const images = [];

	for (const dcmFile of dcmFiles) {
		const image = joinDataPath(`./thumbnails`, path.basename(dcmFile).replace(/\.dcm$/, '.jpg'));
		ensureDirSync(image);

		// Convert the DICOM file to JPEG thumbnail.
		await dcm2jpeg(dcmFile, image);

		// Add the image path to the array.
		images.push(image);

		// Delete the DICOM file.
		fs.rmSync(dcmFile);
	}

	return images;
};

/**
 * Fetches the DICOM files and converts them to JSON data.
 *
 * @param {string} studyUid - The study UID.
 * @param {string} [seriesUid] - (Optional) The series UID.
 * @param {string} [instanceUid] - (Optional) The instance UID.
 * @returns {Promise<Object[]>} A promise that resolves to the JSON data of the resources.
 */
export const fetchDicomJson = async (studyUid, seriesUid, instanceUid) => {
	const dcmFiles = await fetchDicom(studyUid, seriesUid, instanceUid, true);
	if (dcmFiles.length === 0) {
		throw new Error(`No DICOM files found.`);
	}

	const jsonData = [];

	for (const dcmFile of dcmFiles) {
		const jsonFile = dcmFile.replace(/\.dcm$/, '.json');

		// Convert the DICOM file to JSON.
		await dcm2json(dcmFile, jsonFile, { includePixelData: false });

		// Read the JSON file.
		const data = fs.readFileSync(jsonFile, 'utf8');

		// Parse the JSON data and add it to the array.
		jsonData.push(JSON.parse(data));

		// Delete the downloaded files.
		fs.rmSync(dcmFile);
		fs.rmSync(jsonFile);
	}

	return jsonData;
};

/**
 * Fetches the metadata for a given resource.
 *
 * @param {string} studyUid - The study UID.
 * @param {string} [seriesUid] - (Optional) The series UID.
 * @param {string} [instanceUid] - (Optional) The instance UID.
 * @returns {Promise<Object>} A promise that resolves to the metadata of the instance.
 */
export const getMetadata = async (studyUid, seriesUid, instanceUid) => {
	const response = await fetch(api(studyUid, seriesUid, instanceUid) + '/metadata');
	if (response.status !== 200) {
		throw new Error(`Failed to fetch the metadata: (${response.status}) ${await response.text()}`);
	}

	return await response.json();
};
