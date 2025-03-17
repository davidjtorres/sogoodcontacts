import { getContainer } from "@/app/api/inversify.config";
import { ContactsService } from "@/app/api/services/contacts-service";
import { NextRequest, NextResponse } from "next/server";
import { withAuth } from "@/app/api/middleware/auth-middleware";
import { User } from "@/app/api/repositories/user-repository";

export const GET = withAuth(async (request: NextRequest, user: User) => {
	try {
		const container = await getContainer(user);
		const contactsService = container.get(ContactsService);
		const lists = await contactsService.getConstantContactContactLists();
		return NextResponse.json(lists);
	} catch (error) {
		console.error("Error fetching contact lists:", error);
		return NextResponse.json({ error: "Failed to fetch contact lists" }, { status: 500 });
	}
});
