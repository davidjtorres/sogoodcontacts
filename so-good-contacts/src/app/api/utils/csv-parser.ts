import { Readable } from "stream";
import Papa from "papaparse";

export type CSVRecord = Record<string, string | number | boolean | null>;


/**
 * Parse a CSV stream efficiently
 * @param stream The readable stream containing CSV data
 * @param expectedHeaders The expected headers in the CSV file
 * @returns A promise that resolves when parsing is complete with count and parsed data
 */
export async function parseCSVStream(
	stream: Readable,
	expectedHeaders: string[]
): Promise<{ success: boolean; count: number; data: CSVRecord[] }> {
	// First, read just enough to validate the headers
	return new Promise((resolve, reject) => {
		// Read the first chunk to validate headers
		let headerBuffer = "";
		let headerValidated = false;
		let recordCount = 0;
		let allRecords: CSVRecord[] = [];

		// Create a transform function to process chunks
		const processChunk = (chunk: Buffer | string) => {
			const chunkStr = typeof chunk === "string" ? chunk : chunk.toString("utf8");

			if (!headerValidated) {
				// Collect data until we have a complete header line
				headerBuffer += chunkStr;
				const newlineIndex = headerBuffer.indexOf("\n");

				if (newlineIndex !== -1) {
					// We have a complete header line
					const headerLine = headerBuffer.substring(0, newlineIndex).trim();
					const headers = headerLine.split(",").map((h) => h.trim());

					// Validate headers
					if (headers.length !== expectedHeaders.length) {
						throw new Error("Invalid CSV format: incorrect number of headers");
					}

					for (let i = 0; i < expectedHeaders.length; i++) {
						if (headers[i] !== expectedHeaders[i]) {
							throw new Error(`Invalid CSV format: expected header "${expectedHeaders[i]}" but got "${headers[i]}"`);
						}
					}

					headerValidated = true;

					// Now process the rest of the CSV
					const csvContent = headerBuffer;

					// Parse the CSV content we have so far
					const results = Papa.parse(csvContent, {
						header: true,
						skipEmptyLines: true,
					});

					// Count valid records and collect them
					if (results.data && Array.isArray(results.data)) {
						recordCount += results.data.length;
						allRecords = allRecords.concat(results.data as CSVRecord[]);
					}
				}
			} else {
				// Headers already validated, parse this chunk
				try {
					// For chunks after the header, we need to add the header line back
					// to ensure proper parsing with column names
					const partialCsv = expectedHeaders.join(",") + "\n" + chunkStr;

					const results = Papa.parse(partialCsv, {
						header: true,
						skipEmptyLines: true,
					});

					// Count valid records and collect them
					if (results.data && Array.isArray(results.data)) {
						recordCount += results.data.length;
						allRecords = allRecords.concat(results.data as CSVRecord[]);
					}
				} catch (error) {
					console.error("Error parsing CSV chunk:", error);
				}
			}
		};

		// Process the stream
		stream.on("data", (chunk) => {
			try {
				processChunk(chunk);
			} catch (error) {
				stream.destroy();
				reject(error);
			}
		});

		stream.on("end", () => {
			if (!headerValidated) {
				reject(new Error("CSV file ended before headers could be validated"));
			} else {
				const result = {
					success: true,
					count: recordCount,
					data: allRecords
				};
				resolve(result);
			}
		});

		stream.on("error", (error) => {
			console.error("Stream error:", error);
			reject(new Error(`Stream error: ${error.message}`));
		});
	});
}
