import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/app/api/inversify.config";
import { ContactsService } from "@/app/api/services/contacts-service";
import { withAuth } from "@/app/api/middleware/auth-middleware";
import { User } from "@/app/api/models/user";

/**
 * API route to sync contacts from Constant Contact
 * POST /api/contacts/sync
 */
export const POST = withAuth(async (request: NextRequest, user: User) => {
	try {
		const container = await getContainer(user);
		const contactsService = container.get<ContactsService>(ContactsService);

		// Sync contacts from Constant Contact
		const result = await contactsService.syncConstantContactContacts(user);

		// Return success response
		return NextResponse.json(result);
	} catch (error) {
		console.error("Error syncing contacts from Constant Contact:", error);
		return NextResponse.json(
			{ 
				error: error instanceof Error ? error.message : "Failed to sync contacts",
				success: false
			},
			{ status: 500 }
		);
	}
}); 