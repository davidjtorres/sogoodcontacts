import { ConstantContactApiAdapter } from "@/app/api/constant-contact-gateway/constant-contact-api-adapter";
import { Contact } from "@/app/api/models/contact";
import { ContactRepository } from "@/app/api/repositories/contact-repository";
import { injectable, inject } from "inversify";

@injectable()
export class ContactsService {
	constructor(
		@inject(ContactRepository) private readonly contactRepository: ContactRepository,
		@inject(ConstantContactApiAdapter) private readonly constantContactApiAdapter: ConstantContactApiAdapter
	) {}

	async getContacts(userId: string) {
		return this.contactRepository.findAll({ user_id: userId });
	}

	// Create contact in So Good Contacts
	async createContact(contact: Contact) {
		return this.contactRepository.create(contact);
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
}
