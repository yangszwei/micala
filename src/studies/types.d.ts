interface ManageStudiesQuery {
	/** The modality of the study. */
	modality?: string;
	/** The patient ID of the study. */
	patientId?: number;
	/** The patient name of the study. */
	patientName?: string;
	/** Select studies from this date onwards. */
	fromDate?: string;
	/** Select studies up to this date. */
	toDate?: string;
	/** The study instance UID. */
	identifier?: string;
}

/** The query object for the search studies endpoint. */
interface SearchStudiesQuery {
	/** The search term for the studies. */
	search: string;
	/** The instance UID of the study. */
	instance?: string;
	/** The modality of the study. */
	modality?: string;
	/** The patient ID of the study. */
	patientId?: number;
	/** The patient name of the study. */
	patientName?: string;
	/** Select studies from this date onwards. */
	fromDate?: string;
	/** Select studies up to this date. */
	toDate?: string;
	/** The gender of the patient. */
	gender?: string[];
	/** The category of the study. */
	category?: string[];
	/** The maximum number of studies to return. */
	limit?: number;
	/** The number of studies to skip before starting to return. */
	offset?: number;
}
