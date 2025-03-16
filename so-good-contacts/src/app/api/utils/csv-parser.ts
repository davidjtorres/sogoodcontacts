// parse a csv file using papaparse
import Papa from "papaparse";

export function parseCSV(csv: string, headers: string[]) {
	const csvHeaders = csv.split("\n")[0].split(",");
	if (csvHeaders.length !== headers.length) {
		throw new Error("Invalid CSV file");
	}

	headers.forEach((header, index) => {
		if (csvHeaders[index] !== header) {
			throw new Error("Invalid CSV file");
		}
	});

	const result = Papa.parse(csv, {
		header: true,
		skipEmptyLines: true,
	});
	return result.data;
}
