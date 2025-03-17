import { getContainer } from "@/app/api/inversify.config";
import { ContactsService } from "@/app/api/services/contacts-service";
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/middleware/auth-middleware";
import { User } from "@/app/api/models/user";

export const GET = withAuth(async (request: NextRequest, user: User) => {
	try {
		// Get pagination parameters from query
		const searchParams = request.nextUrl.searchParams;
		const page = parseInt(searchParams.get("page") || "1", 10);
		const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
		const sortField = searchParams.get("sortField") || "_id";
		const sortDirection = parseInt(searchParams.get("sortDirection") || "1", 10) as 1 | -1;

		const container = await getContainer(user);
		const contactsService = container.get(ContactsService);
		// Use the new pagination method
		const paginatedContacts = await contactsService.getContactsWithPagination(
			user.id as string,
			page,
			pageSize,
			sortField,
			sortDirection
		);
		// Return the paginated contacts
		return NextResponse.json(paginatedContacts);
	} catch (error) {
		console.error("Error fetching contacts:", error);
		return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
	}
});

export const POST = withAuth(async (request: NextRequest, user: User) => {
	try {
		const container = await getContainer(user);
		const contactsService = container.get(ContactsService);
		const contact = (await request.json())["contact"];
		// Add user_id to the contact
		contact.user_id = user.id;
		const newContact = await contactsService.createContact(contact);
		return NextResponse.json(newContact);
	} catch (error) {
		console.error("Error creating contact:", error);
		return NextResponse.json({ error: "Failed to create contact" }, { status: 500 });
	}
});
