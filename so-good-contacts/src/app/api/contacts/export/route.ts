import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/app/api/inversify.config";
import { ContactsService } from "@/app/api/services/contacts-service";
import { withAuth } from "@/app/api/middleware/auth-middleware";
import { User } from "@/app/api/repositories/user-repository";

export const GET = withAuth(async (request: NextRequest, user: User) => {
	try {
		const container = await getContainer(user);
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
});
