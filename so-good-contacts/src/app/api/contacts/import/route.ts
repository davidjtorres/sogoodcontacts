import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import { parseCSVStream } from "@/app/api/utils/csv-parser";
import { getContainer } from "@/app/api/inversify.config";
import { ContactsService } from "@/app/api/services/contacts-service";

// Expected CSV headers
const EXPECTED_HEADERS = [
	"first_name",
	"last_name",
	"email",
	"phone_number",
	"address_line_1",
	"address_line_2",
	"city",
	"state",
	"zipcode",
	"country",
];

// Mock user for development
const authUser = {
	id: "67cf575d562cd26f0c2ffe49",
	name: "John Doe",
	email: "john.doe@example.com",
	constant_contact_token: "...",
};

export async function POST(request: NextRequest) {
	try {
		const contentType = request.headers.get("content-type") || "";
		console.log(`Content-Type: ${contentType}`);

		// Verify content type is multipart/form-data
		if (!contentType.includes("multipart/form-data")) {
			return NextResponse.json({ error: "Content type must be multipart/form-data" }, { status: 400 });
		}

		// Get the form data
		const formData = await parseFormData(request);
		const file = formData.get("file") as File;

		if (!file) {
			return NextResponse.json({ error: "No file provided" }, { status: 400 });
		}

		// Check file type
		if (!file.name.endsWith(".csv")) {
			return NextResponse.json({ error: "File must be a CSV" }, { status: 400 });
		}

		// Check file size (2MB limit)
		const MAX_SIZE = 5 * 1024 * 1024; // 2MB
		if (file.size > MAX_SIZE) {
			return NextResponse.json(
				{ error: `File size exceeds the 2MB limit (${(file.size / (1024 * 1024)).toFixed(2)}MB)` },
				{ status: 400 }
			);
		}

		// Convert file to stream
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);
		const stream = Readable.from(buffer);

		// Parse the CSV stream
		const result = await parseCSVStream(stream, EXPECTED_HEADERS);

		// Get the container and service
		const container = await getContainer(authUser);
		const contactsService = container.get<ContactsService>(ContactsService);

		// Log success but don't wait for contacts to be created
		// This allows us to return a quick response to the client
		processContactsInBackground(contactsService, result.data, authUser.id);

		// Return success response
		return NextResponse.json({
			success: true,
			importedCount: result.count,
			invalidCount: 0,
			// Return a sample of the first 5 records for preview
			sampleData: result.data.slice(0, 5),
		});
	} catch (error) {
		console.error("Error processing CSV import:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Failed to process CSV file" },
			{ status: 500 }
		);
	}
}

/**
 * Parse multipart form data from request
 */
async function parseFormData(request: NextRequest): Promise<FormData> {
	const formData = await request.formData();
	return formData;
}

/**
 * Process contacts in the background without blocking the response
 */
async function processContactsInBackground(
	contactsService: ContactsService,
	contactsData: Contact[],
	userId: string
): Promise<void> {
	try {
		await contactsService.createContact(contactsData);
	} catch (error) {
		console.error("Error processing contacts in background:", error);
	}
}
