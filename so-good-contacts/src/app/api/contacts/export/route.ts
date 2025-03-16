import { NextResponse } from "next/server";
import { getContainer } from "@/app/api/inversify.config";
import { ContactsService } from "@/app/api/services/contacts-service";

const authUser = {
	id: "67cf575d562cd26f0c2ffe49",
	name: "John Doe",
	email: "john.doe@example.com",
	constant_contact_token: "...",
};  

export async function GET() {
	try {
		const container = await getContainer(authUser);
		const contactsService = container.get<ContactsService>(ContactsService);

		// Get the stream from the service with the user ID
		const csvStream = await contactsService.exportContacts();

		// Create a response with the appropriate headers
		const response = new NextResponse(csvStream);

		// Set headers for CSV download
		response.headers.set("Content-Type", "text/csv; charset=utf-8");
		response.headers.set("Content-Disposition", "attachment; filename=contacts.csv");

		return response;
	} catch (error) {
		console.error("Error exporting contacts:", error);
		return NextResponse.json({ error: "Failed to export contacts" }, { status: 500 });
	}
}
