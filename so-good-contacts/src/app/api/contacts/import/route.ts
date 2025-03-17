import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import { getContainer } from "@/app/api/inversify.config";
import { ContactsService } from "@/app/api/services/contacts-service";
import { withAuth } from "@/app/api/middleware/auth-middleware";
import { User } from "@/app/api/repositories/user-repository";

export const POST = withAuth(async (request: NextRequest, user: User) => {
	try {
		const contentType = request.headers.get("content-type") || "";

		// Verify content type is multipart/form-data
		if (!contentType.includes("multipart/form-data")) {
			return NextResponse.json({ error: "Content type must be multipart/form-data" }, { status: 400 });
		}

		// Get the form data
		const formData = await parseFormData(request);
		const file = formData.get("file") as File;
		// Check if we should import to Constant Contact from query params
		const importToConstantContact = request.nextUrl.searchParams.get("import_to_constant_contact") === "true";
        console.log("importToConstantContact", importToConstantContact);

		if (!file) {
			return NextResponse.json({ error: "No file provided" }, { status: 400 });
		}

		// Check file type
		if (!file.name.endsWith(".csv")) {
			return NextResponse.json({ error: "File must be a CSV" }, { status: 400 });
		}

		// Check file size (2MB limit)
		const MAX_SIZE = 4 * 1024 * 1024; // 2MB
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

		// Get the container and service
		const container = await getContainer(user);
		const contactsService = container.get<ContactsService>(ContactsService);

		// Process the CSV import using the service
		const result = await contactsService.importContactsFromCSV(stream, user.id as string, importToConstantContact);

		// Return success response
		return NextResponse.json(result);
	} catch (error) {
		console.error("Error processing CSV import:", error);
		return NextResponse.json(
			{ error: error instanceof Error ? error.message : "Failed to process CSV file" },
			{ status: 500 }
		);
	}
});

/**
 * Parse multipart form data from request
 */
async function parseFormData(request: NextRequest): Promise<FormData> {
	const formData = await request.formData();
	return formData;
}
