import db from '#lib/mongodb/client.js';
import fs from 'fs/promises';

/**
 * Save reports to the database.
 *
 * @param {{ patientId: string; reportNumber: string; files: string[] }} report - The report to save.
 */
export const saveReports = async (report) => {
	const reports = [];

	for (const filepath of report.files) {
		const file = await fs.readFile(filepath);
		reports.push(file.toString());
	}

	await db()
		.collection('reports')
		.updateOne(
			{ patientId: report.patientId, reportNumber: report.reportNumber },
			{ $push: { reports: { $each: reports } } },
			{ upsert: true },
		);
};
