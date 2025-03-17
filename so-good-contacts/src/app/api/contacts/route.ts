import { getContainer } from "@/app/api/inversify.config";
import { ContactsService } from "@/app/api/services/contacts-service";
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/middleware/auth-middleware";
import { User } from "@/app/api/repositories/user-repository";

export const GET = withAuth(async (request: NextRequest, user: User) => {
	try {
		const container = await getContainer(user);
		const contactsService = container.get(ContactsService);
		const contacts = await contactsService.getContactsWithCursor(user.id as string);
		return NextResponse.json({
			contacts: contacts,
		});
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
