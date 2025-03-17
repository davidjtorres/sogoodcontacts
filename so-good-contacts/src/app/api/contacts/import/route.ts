import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import { getContainer } from "@/app/api/inversify.config";
import { ContactsService } from "@/app/api/services/contacts-service";

// Mock user for development
const authUser = {
	id: "67cf575d562cd26f0c2ffe49",
	name: "John Doe",
	email: "john.doe@example.com",
	constant_contact_token:
		"eyJraWQiOiJqRFZQN1F2eHdsaXdZV09sWFpVUDBOUlQ3aml6dlZQaXBwVWRUcFJselZZIiwiYWxnIjoiUlMyNTYifQ.eyJ2ZXIiOjEsImp0aSI6IkFULnhFN0NQWW5xZ002NlFtdkdyWjFwZ2hPOVltNndfTkZnUGViZ1cyLUR1OVEub2FyMW1qc2lrd0lqZERUWkcwaDciLCJpc3MiOiJodHRwczovL2lkZW50aXR5LmNvbnN0YW50Y29udGFjdC5jb20vb2F1dGgyL2F1czFsbTNyeTltRjd4MkphMGg4IiwiYXVkIjoiaHR0cHM6Ly9hcGkuY2MuZW1haWwvdjMiLCJpYXQiOjE3NDIyMTI0MjEsImV4cCI6MTc0MjI5ODgyMSwiY2lkIjoiMTNjM2Y2ZTMtZjE0Yy00MGQ2LTgyOWEtYjhjMWZlMjgyZGVlIiwidWlkIjoiMDB1MjFpZ3FiNmtUQTd1NkowaDgiLCJzY3AiOlsib2ZmbGluZV9hY2Nlc3MiLCJjb250YWN0X2RhdGEiXSwiYXV0aF90aW1lIjoxNzQyMjEyMzg0LCJzdWIiOiJkYXZpZGpfdG9ycmVzQG91dGxvb2suY29tIiwicGxhdGZvcm1fdXNlcl9pZCI6IjhhY2NmMDBmLWYzODQtNGQ5Ni1iNGIyLWJkMTE0OTA4MWY2YiJ9.QQxC8F5gVeRIQWhqilh988Q-bd-e4EW_KuX1u4773bNpcNlmzuEPzLk70qh9B_QGkZo0xsAK6-R-o6Fry6L36bWulFfWQhwzvPF46OUqaP_09qi-VQ_pApXuXCe8FSsacYisunTKXt6DL7NvpJYgytEVetKg-ajQfcKhYOtxfip4Qqe5d-g4MWeI0XStlwfVZsyZ_5YOoQ83nuDDYdQa3zjWWHJOfAUGmZRK4Ai8rlyv3RwDx3o19BsSJVMCigCsrV70DcRZ8MaAbbO3_oTwUzjxOPnbcYPSzJDUmG-N7mxWa_62osJy9zcwXrs4IyGj11BTwmfTlo4MoBkQu70KJg",
};

/**
 *Body params:
 *importToConstantContact: boolean
 *file: file
 */
export async function POST(request: NextRequest) {
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

		if (!file) {
			return NextResponse.json({ error: "No file provided" }, { status: 400 });
		}

		// Check file type
		if (!file.name.endsWith(".csv")) {
			return NextResponse.json({ error: "File must be a CSV" }, { status: 400 });
		}

		// Check file size (2MB limit)
		const MAX_SIZE = 2 * 1024 * 1024; // 2MB
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
		const container = await getContainer(authUser);
		const contactsService = container.get<ContactsService>(ContactsService);

		// Process the CSV import using the service
		const result = await contactsService.importContactsFromCSV(stream, authUser.id, importToConstantContact);

		// Return success response
		return NextResponse.json(result);
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
