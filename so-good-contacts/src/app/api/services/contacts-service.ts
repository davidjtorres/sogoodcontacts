import { ConstantContactApiAdapter } from "@/app/api/constant-contact-gateway/constant-contact-api-adapter";
import { Contact } from "@/app/api/models/contact";
import { ContactRepository } from "@/app/api/repositories/contact-repository";
import { injectable, inject } from "inversify";
import { Readable } from "stream";
import { parseCSVStream, CSVRecord } from "@/app/api/utils/csv-parser";
import { convertToDBObjectId } from "@/app/api/database/utils";
import { UserRepository } from "@/app/api/repositories/user-repository";
import { User } from "@/app/api/models/user";
import { jobStatusTracker, JobStatus } from "@/app/api/services/job-status-tracker";

// Expected CSV headers for contact imports
export const CONTACT_CSV_HEADERS = [
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

@injectable()
export class ContactsService {
	constructor(
		@inject(ContactRepository) private readonly contactRepository: ContactRepository,
		@inject(ConstantContactApiAdapter) private readonly constantContactApiAdapter: ConstantContactApiAdapter,
		@inject(UserRepository) private readonly userRepository: UserRepository
	) {}

	async getContacts(userId: string) {
		return this.contactRepository.findAll({ user_id: userId });
	}
	/**
	 * Get contacts with page-based pagination
	 * @param userId User ID to filter contacts
	 * @param page Page number (1-based)
	 * @param pageSize Number of items per page
	 * @param sortField Field to sort by
	 * @param sortDirection Sort direction (1 for ascending, -1 for descending)
	 * @returns Paginated contacts with metadata
	 */
	async getContactsWithPagination(
		userId: string | undefined,
		page: number = 1,
		pageSize: number = 20,
		sortField: string = "_id",
		sortDirection: 1 | -1 = 1
	) {
		if (!userId) {
			throw new Error("User ID is required");
		}
		return this.contactRepository.findWithPagination(
			{ user_id: convertToDBObjectId(userId) },
			page,
			pageSize,
			sortField,
			sortDirection
		);
	}

	// Create contact in So Good Contacts
	async createContact(contact: Contact | Contact[]) {
		return this.contactRepository.create(contact);
	}

	/**
	 * Parse a CSV file stream and import contacts
	 * @param stream The readable stream containing CSV data
	 * @param userId The user ID to associate with the imported contacts
	 * @param importToConstantContact Whether to also import contacts to Constant Contact
	 * @returns Object containing success status, count, and sample data
	 */
	async importContactsFromCSV({
		stream,
		userId,
		importToConstantContact = false,
		constantContactListsIds = [],
	}: {
		stream: Readable;
		userId: string;
		importToConstantContact: boolean;
		constantContactListsIds: string[];
	}) {
		// Parse the CSV stream
		const result = await parseCSVStream(stream, CONTACT_CSV_HEADERS);
		// Transform CSV records to Contact objects
		const contacts = this.transformCSVToContacts(result.data, userId);
		// Create contacts in the background
		this.createContactsInBackground(contacts, importToConstantContact, constantContactListsIds);
		// Return result with sample data
		return {
			success: true,
			importedCount: result.count,
		};
	}

	/**
	 * Transform CSV records to Contact objects
	 * @param csvRecords The CSV records to transform
	 * @param userId The user ID to associate with the contacts
	 * @returns Array of Contact objects
	 */
	private transformCSVToContacts(csvRecords: CSVRecord[], userId: string): Contact[] {
		return csvRecords.map((record) => {
			return {
				user_id: convertToDBObjectId(userId),
				first_name: String(record.first_name || ""),
				last_name: String(record.last_name || ""),
				email: String(record.email || ""),
				phone_number: String(record.phone_number || ""),
				address: {
					address_line_1: String(record.address_line_1 || ""),
					address_line_2: String(record.address_line_2 || ""),
					city: String(record.city || ""),
					state: String(record.state || ""),
					zipcode: String(record.zipcode || ""),
					country: String(record.country || ""),
				},
				source: "so_good_contacts",
			};
		});
	}

	/**
	 * Create contacts in the background without blocking
	 * @param contacts The contacts to create
	 * @param importToConstantContact Whether to also import contacts to Constant Contact
	 * @param constantContactListsIds The list IDs to import contacts to
	 */
	private async createContactsInBackground(
		contacts: Contact[],
		importToConstantContact = false,
		constantContactListsIds: string[]
	): Promise<void> {
		try {
			// Create contacts in So Good Contacts
			this.createContact(contacts).catch((error) => {
				console.error("Error creating contacts in background:", error);
			});
			// If importToConstantContact is true, also import to Constant Contact
			if (importToConstantContact && contacts.length > 0) {
				this.importContactsToConstantContact(contacts, constantContactListsIds).catch((error) => {
					console.error("Error importing contacts to Constant Contact:", error);
				});
			}
		} catch (error) {
			console.error("Error processing contacts in background:", error);
		}
	}

	// Import contacts to Constant Contact
	async importContactsToConstantContact(contacts: Contact[], constantContactListsIds: string[]) {
		return this.constantContactApiAdapter.importContacts(contacts, constantContactListsIds);
	}

	/**
	 * Sync contacts from Constant Contact to So Good Contacts
	 * Note: This method is suitable for small to medium syncs (up to a few hundred contacts)
	 * For larger syncs, use startBulkConstantContactSync instead
	 *
	 * @param user The user to sync contacts for
	 * @returns Object containing success status, count, and last synced timestamp
	 */
	async syncConstantContactContacts(user: User): Promise<{ success: boolean; count: number; last_synced_at: string }> {
		try {
			// Format last_synced_at as ISO string if it exists
			const updated_after = user.last_synced_at ? new Date(user.last_synced_at).toISOString() : undefined;

			// Fetch contacts from Constant Contact
			const contacts = await this.constantContactApiAdapter.getContacts(updated_after);

			// Add user id to contacts
			contacts.forEach((contact) => {
				if (user._id) {
					contact.user_id = convertToDBObjectId(String(user._id));
				} else if (user.id) {
					contact.user_id = convertToDBObjectId(String(user.id));
				}
			});

			// Save contacts to database
			if (contacts.length > 0) {
				await this.contactRepository.create(contacts);
			}

			// Update user's last_synced_at timestamp
			const now = new Date();
			const userId = user._id || user.id;
			if (userId) {
				await this.userRepository.update({ _id: convertToDBObjectId(String(userId)) }, { last_synced_at: now });
			}

			return {
				success: true,
				count: contacts.length,
				last_synced_at: now.toISOString(),
			};
		} catch (error) {
			console.error("Error syncing contacts from Constant Contact:", error);
			throw error;
		}
	}

	/**
	 * Start a bulk sync process for retrieving all contacts from Constant Contact
	 * This method processes contacts in batches to efficiently handle large datasets
	 * @param user The user to sync contacts for
	 * @returns Object containing job information and initial status
	 */
	async startBulkConstantContactSync(user: User): Promise<{
		success: boolean;
		message: string;
		job_id: string;
		status: string;
	}> {
		try {
			// Create a new job in the job status tracker
			const userId = String(user._id || user.id);
			const job = jobStatusTracker.createJob(userId, "constant_contact_sync");

			// Start the background process
			this.processBulkSyncInBackground(user, job.job_id);

			return {
				success: true,
				message: "Bulk sync started. This process will continue in the background.",
				job_id: job.job_id,
				status: job.status,
			};
		} catch (error) {
			console.error("Error starting bulk sync:", error);
			throw error;
		}
	}

	/**
	 * Process the bulk sync in the background
	 *
	 * @param user The user to sync contacts for
	 * @param jobId The ID of the sync job
	 */
	private async processBulkSyncInBackground(user: User, jobId: string): Promise<void> {
		// Format last_synced_at as ISO string if it exists
		const updated_after = user.last_synced_at ? new Date(user.last_synced_at).toISOString() : undefined;
		let totalProcessed = 0;
		let batchErrors = 0;

		try {
			// Update job status to in_progress
			jobStatusTracker.updateJob(jobId, { status: "in_progress" });

			// Process contacts in batches
			const totalContacts = await this.constantContactApiAdapter.getAllContactsInBatches(
				updated_after,
				async (contacts, batchNumber) => {
					try {
						// Add user ID to all contacts
						contacts.forEach((contact) => {
							if (user._id) {
								contact.user_id = convertToDBObjectId(String(user._id));
							} else if (user.id) {
								contact.user_id = convertToDBObjectId(String(user.id));
							}
						});

						// Save contacts to database in batches
						await this.contactRepository.create(contacts);

						// Update counts
						totalProcessed += contacts.length;

						// Update job status
						jobStatusTracker.updateJob(jobId, {
							processed_contacts: totalProcessed,
						});

						console.log(`Processed batch ${batchNumber}, total processed: ${totalProcessed}`);
					} catch (error) {
						console.error(`Error processing batch ${batchNumber}:`, error);
						batchErrors++;

						// Update error count in job status
						jobStatusTracker.updateJob(jobId, {
							failed_contacts: batchErrors,
						});
					}
				}
			);

			// Update job status with total contacts
			jobStatusTracker.updateJob(jobId, {
				total_contacts: totalContacts,
			});

			// Update user's last_synced_at timestamp
			const now = new Date();
			const userId = user._id || user.id;
			if (userId) {
				await this.userRepository.update({ _id: convertToDBObjectId(String(userId)) }, { last_synced_at: now });
			}

			// Mark job as completed
			jobStatusTracker.completeJob(jobId, {
				total: totalContacts,
				processed: totalProcessed,
				failed: batchErrors,
			});

			console.log(
				`Sync job ${jobId} completed. Processed ${totalProcessed}/${totalContacts} contacts with ${batchErrors} batch errors.`
			);
		} catch (error) {
			// Mark job as failed
			const errorMessage = error instanceof Error ? error.message : "Unknown error";
			jobStatusTracker.failJob(jobId, errorMessage);
			console.error(`Sync job ${jobId} failed:`, error);
		}
	}

	/**
	 * Get the status of a bulk sync job
	 *
	 * @param jobId The ID of the sync job
	 * @returns The current status of the job
	 */
	async getBulkSyncStatus(jobId: string): Promise<JobStatus> {
		// Get job status from tracker
		const job = jobStatusTracker.getJob(jobId);

		if (!job) {
			// Return a default response if job not found
			return {
				job_id: jobId,
				status: "not_found",
				type: "unknown",
				total_contacts: 0,
				processed_contacts: 0,
				failed_contacts: 0,
				progress_percentage: 0,
				start_time: new Date(),
				last_updated: new Date(),
			};
		}

		return job;
	}

	async exportContacts() {
		// Use the repository to stream contacts to CSV for the specific user
		return this.contactRepository.exportContactsToCSV();
	}
}
