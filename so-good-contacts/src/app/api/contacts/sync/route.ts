import { NextRequest, NextResponse } from "next/server";
import { getContainer } from "@/app/api/inversify.config";
import { ContactsService } from "@/app/api/services/contacts-service";
import { withAuth } from "@/app/api/middleware/auth-middleware";
import { User } from "@/app/api/models/user";

/**
 * API route to sync contacts from Constant Contact
 * POST /api/contacts/sync
 * 
 * This endpoint now handles both regular sync and background job sync for large datasets.
 * The sync will automatically run as a background job to handle large datasets efficiently.
 */
export const POST = withAuth(async (request: NextRequest, user: User) => {
	try {
		const container = await getContainer(user);
		const contactsService = container.get<ContactsService>(ContactsService);

		// Start sync as a background job for more efficient processing
		const result = await contactsService.startBulkConstantContactSync(user);

		// Return success response with job information
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

/**
 * API route to get the status of a sync job
 * GET /api/contacts/sync?jobId=123456789
 */
export const GET = withAuth(async (request: NextRequest, user: User) => {
	try {
		// Get the job ID from the query parameters
		const url = new URL(request.url);
		const jobId = url.searchParams.get("jobId");

		if (!jobId) {
			return NextResponse.json(
				{
					error: "Job ID is required",
					success: false
				},
				{ status: 400 }
			);
		}

		const container = await getContainer(user);
		const contactsService = container.get<ContactsService>(ContactsService);

		// Get the status of the sync job
		const status = await contactsService.getBulkSyncStatus(jobId);

		// Return the job status
		return NextResponse.json(status);
	} catch (error) {
		console.error("Error getting sync job status:", error);
		return NextResponse.json(
			{
				error: error instanceof Error ? error.message : "Failed to get sync job status",
				success: false
			},
			{ status: 500 }
		);
	}
}); 