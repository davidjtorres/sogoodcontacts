import { ConstantContactApiAdapter } from "@/app/api/constant-contact-gateway/constant-contact-api-adapter";
import { Contact } from "@/app/api/models/contact";
import { ContactRepository } from "@/app/api/repositories/contact-repository";
import { injectable, inject } from "inversify";
import { Readable } from "stream";
import { parseCSVStream, CSVRecord } from "@/app/api/utils/csv-parser";

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
		@inject(ConstantContactApiAdapter) private readonly constantContactApiAdapter: ConstantContactApiAdapter
	) {}

	async getContacts(userId: string) {
		return this.contactRepository.findAll({ user_id: userId });
	}

	async getContactsWithCursor(userId: string) {
		return this.contactRepository.findByUserId(userId);
	}

	// Create contact in So Good Contacts
	async createContact(contact: Contact | Contact[]) {
		return this.contactRepository.create(contact);
	}

	/**
	 * Parse a CSV file stream and import contacts
	 * @param stream The readable stream containing CSV data
	 * @param userId The user ID to associate with the imported contacts
	 * @returns Object containing success status, count, and sample data
	 */
	async importContactsFromCSV(stream: Readable, userId: string) {
		// Parse the CSV stream
		const result = await parseCSVStream(stream, CONTACT_CSV_HEADERS);
		// Transform CSV records to Contact objects
		const contacts = this.transformCSVToContacts(result.data, userId);
		// Create contacts in the background
		this.createContactsInBackground(contacts);
		// Return result with sample data
		return {
			success: true,
			importedCount: result.count,
			invalidCount: 0,
			sampleData: result.data.slice(0, 5)
		};
	}

	/**
	 * Transform CSV records to Contact objects
	 * @param csvRecords The CSV records to transform
	 * @param userId The user ID to associate with the contacts
	 * @returns Array of Contact objects
	 */
	private transformCSVToContacts(csvRecords: CSVRecord[], userId: string): Contact[] {
		return csvRecords.map(record => {
			return {
				user_id: userId,
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
					country: String(record.country || "")
				},
				source: "so_good_contacts"
			};
		});
	}

	/**
	 * Create contacts in the background without blocking
	 * @param contacts The contacts to create
	 */
	private async createContactsInBackground(contacts: Contact[]): Promise<void> {
		try {
			// await for 4 seconds
			await new Promise(resolve => setTimeout(resolve, 4000));
			// Create contacts without awaiting to avoid blocking
			this.createContact(contacts).catch(error => {
				console.error("Error creating contacts in background:", error);
			});
		} catch (error) {
			console.error("Error processing contacts in background:", error);
		}
	}

	// Get contact lists from Constant Contact
	async getConstantContactContactLists() {
		return this.constantContactApiAdapter.getContactLists();
	}

	// Get contacts from Constant Contact
	async getContactsFromConstantContact() {
		return this.constantContactApiAdapter.getContacts();
	}

	// Import contacts to Constant Contact
	async importContacts(contacts: Contact[]) {
		return this.constantContactApiAdapter.importContacts(contacts);
	}

	// Sync contacts from Constant Contact to So Good Contacts
	async syncConstantContactContacts() {
		const contacts = await this.getContactsFromConstantContact();
		this.contactRepository.create(contacts);
	}

	async exportContacts() {
		// Use the repository to stream contacts to CSV for the specific user
		return this.contactRepository.exportContactsToCSV();
	}
}
