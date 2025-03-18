import { ConstantContactApi } from "./constant-contact-api";
import { inject, injectable } from "inversify";
import { Contact } from "@/app/api/models/contact";
import {
	IConstantContactApiContact,
	IConstantContactApiImportContact,
} from "./contant-contact-gateway.interfaces";

@injectable()
export class ConstantContactApiAdapter {
	constructor(@inject(ConstantContactApi) private readonly constantContactApi: ConstantContactApi) {}

	/**
	 * Get contacts from Constant Contact
	 * Note: For large datasets, consider using getAllContactsInBatches instead
	 * @param updated_after - Returns contacts updated after the specified date
	 * @returns List of contacts
	 */
	async getContacts(updated_after?: string): Promise<Contact[]> {
		const result = await this.constantContactApi.getContacts(updated_after);
		return this.mapApiContactsToContacts(result.contacts);
	}

	/**
	 * Maps Constant Contact API contacts to our Contact model
	 * @param apiContacts - Contacts from Constant Contact API
	 * @returns List of contacts in our model format
	 */
	private mapApiContactsToContacts(apiContacts: IConstantContactApiContact[]): Contact[] {
		return apiContacts.map((contact) => ({
			user_id: null,
			first_name: contact.first_name,
			last_name: contact.last_name,
			email: contact.email_address.address,
			phone_number: contact?.phone_numbers?.[0]?.phone_number,
			source: "constant_contact",
			address: {
				address_line_1: contact.street_addresses?.[0]?.street,
				city: contact.street_addresses?.[0]?.city,
				state: contact.street_addresses?.[0]?.state,
				zipcode: contact.street_addresses?.[0]?.postal_code,
				country: contact.street_addresses?.[0]?.country,
			},
		}));
	}

	/**
	 * Get all contacts from Constant Contact with automatic pagination
	 * Processes contacts in batches to handle large datasets
	 * @param updated_after - Returns contacts updated after the specified date
	 * @param batchProcessor - Function to process each batch of contacts
	 * @returns Total number of contacts processed
	 */
	async getAllContactsInBatches(
		updated_after?: string,
		batchProcessor?: (contacts: Contact[], batchNumber: number) => Promise<void>
	): Promise<number> {
		let totalContacts = 0;

		// Use the batch callback to process contacts in chunks
		await this.constantContactApi.getAllContacts(
			updated_after,
			async (apiContacts, batchNumber) => {
				// Convert API contacts to our contact model
				const contacts = this.mapApiContactsToContacts(apiContacts);
				totalContacts += contacts.length;

				// Process the batch if a processor is provided
				if (batchProcessor) {
					await batchProcessor(contacts, batchNumber);
				}
			}
		);

		return totalContacts;
	}

	async createContact(contact: Contact): Promise<Contact> {
		const apiContact: Partial<IConstantContactApiContact> = {
			email_address: {
				address: contact.email,
				permission_to_send: "explicit",
			},
			first_name: contact.first_name,
			last_name: contact.last_name,
			create_source: "Account",
			phone_numbers: contact.phone_number
				? [
						{
							phone_number: contact.phone_number,
							kind: "home",
						},
				  ]
				: [],
			custom_fields: [],
			street_addresses: contact.address
				? [
						{
							kind: "home",
							street: contact.address.address_line_1,
							city: contact.address.city,
							state: contact.address.state,
							postal_code: contact.address.zipcode,
							country: contact.address.country,
						},
				  ]
				: [],
			list_memberships: [],
			taggings: [],
			notes: [],
		};

		// Call the API
		const createdContact = await this.constantContactApi.createContact(apiContact);
		// Transform the response back to Contact
		return {
			id: createdContact.contact_id,
			first_name: createdContact.first_name,
			last_name: createdContact.last_name,
			email: createdContact.email_address.address,
			user_id: contact.user_id,
			phone_number: createdContact.phone_numbers[0]?.phone_number,
			address: contact.address,
		};
	}

	async importContacts(contacts: Contact[], listIds: string[] = []): Promise<Contact[]> {
		const importContacts: IConstantContactApiImportContact[] = contacts.map((contact) => ({
			email: contact.email,
			first_name: contact.first_name,
			last_name: contact.last_name,
			phone: contact.phone_number,
			...(contact.address && {
				street: contact.address.address_line_1,
				street2: contact.address.address_line_2,
				city: contact.address.city,
				state: contact.address.state,
				zip: contact.address.zipcode,
				country: contact.address.country,
			}),
			"cf:integration_source": "so-good-contacts",
		}));

		return this.constantContactApi.importContacts(importContacts, listIds);
	}

	async getContactLists() {
		return this.constantContactApi.getContactLists();
	}
}
