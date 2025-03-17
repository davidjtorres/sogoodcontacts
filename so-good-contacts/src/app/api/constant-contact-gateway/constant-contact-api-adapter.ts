import { ConstantContactApi } from "./constant-contact-api";
import { inject, injectable } from "inversify";
import { Contact } from "@/app/api/models/contact";
import {
	IConstantContactApiContact,
	IConstantContactApiImportContact,
	IConstantContactApiContactList,
} from "./contant-contact-gateway.interfaces";

@injectable()
export class ConstantContactApiAdapter {
	constructor(@inject(ConstantContactApi) private readonly constantContactApi: ConstantContactApi) {}

	async getContacts(updated_after?: string): Promise<Contact[]> {
		const getContactsFromConstantContact = await this.constantContactApi.getContacts(updated_after);
		const contacts: Contact[] = getContactsFromConstantContact.map((contact) => {
			const contactObj: Contact = {
				user_id: null,
				first_name: contact.first_name,
				last_name: contact.last_name,
				email: contact.email_address.address,
				phone_number: contact?.phone_numbers?.[0]?.phone_number,
				source: "constant_contact",
			};
			return contactObj;
		});

		return contacts;
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
		const lists = await this.constantContactApi.getContactLists();

		return lists.map((list: IConstantContactApiContactList) => ({
			id: list.id,
			name: list.name,
		}));
	}
}
