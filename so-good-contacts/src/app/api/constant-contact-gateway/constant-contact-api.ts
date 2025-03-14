import type { AxiosInstance } from "axios";
import { injectable } from "inversify";
import type {
	IConstantContactApiContact,
	IConstantContactApiImportContact,
} from "./contant-contact-gateway.interfaces";

@injectable()
export class ConstantContactApi {
	constructor(private readonly httpClient: AxiosInstance, private readonly token: string) {
		this.httpClient.interceptors.request.use((config) => {
			config.headers.Authorization = `Bearer ${this.token}`;
			config.headers["Content-Type"] = "application/json";
			return config;
		});
	}

	/**
	 * Get contacts
	 * @param updated_after - Returns contacts updated after the specified date - format: YYYY-MM-DD
	 * @returns Contacts list
	 */
	async getContacts(updated_after?: string): Promise<IConstantContactApiContact[]> {
		const params = updated_after ? { updated_after } : {};
		const response = await this.httpClient.get(`/contacts`, { params });
		return response.data.contacts;
	}

	async createContact(contact: Partial<IConstantContactApiContact>) {
		const response = await this.httpClient.post(`/contacts`, contact);
		return response.data;
	}

	async importContacts(contacts: IConstantContactApiImportContact[], list_ids: string[]) {
		const response = await this.httpClient.post(`/activities/contacts_json_import`, {
			import_data: contacts,
			list_ids,
		});
		return response.data;
	}

	async getContactLists() {
		try {
			const response = await this.httpClient.get(`/contact_lists`);
			return response.data.lists;
		} catch (error) {
			console.error("Error fetching contact lists:", JSON.stringify(error.response.data) );
			throw error;
		}
	}
}