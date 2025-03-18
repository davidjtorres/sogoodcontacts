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
	 * @param url - Optional URL for pagination (from _links.next.href)
	 * @returns Object containing contacts list and pagination info
	 */
	async getContacts(
		updated_after?: string,
		url?: string
	): Promise<{
		contacts: IConstantContactApiContact[];
		nextPageUrl: string | null;
	}> {
		if (url) {
			//get cursor from url
			const cursor = url.split("cursor=")[1];
			// If a URL is provided, use it directly for pagination
			const response = await this.httpClient.get("/contacts", { params: { cursor } });
			return {
				contacts: response.data.contacts,
				nextPageUrl: response.data._links?.next?.href || null,
			};
		} else {
			// For the initial request
			const params = {
				updated_after,
				include: "custom_fields,phone_numbers,street_addresses",
				limit: 500,
			};
			const response = await this.httpClient.get(`/contacts`, { params });
			return {
				contacts: response.data.contacts,
				nextPageUrl: response.data._links?.next?.href || null,
			};
		}
	}

	/**
	 * Get all contacts by automatically handling pagination
	 * @param updated_after - Returns contacts updated after the specified date - format: YYYY-MM-DD
	 * @param batchCallback - Optional callback function called for each batch of contacts
	 * @returns All contacts
	 */
	async getAllContacts(
		updated_after?: string,
		batchCallback?: (contacts: IConstantContactApiContact[], batchNumber: number) => Promise<void>
	): Promise<IConstantContactApiContact[]> {
		let allContacts: IConstantContactApiContact[] = [];
		let nextPageUrl: string | null = null;
		let batchNumber = 0;

		do {
			const result = await this.getContacts(updated_after, nextPageUrl || undefined);
			batchNumber++;
			// Add contacts to our collection
			allContacts = [...allContacts, ...result.contacts];
			// Call the batch callback if provided
			if (batchCallback && result.contacts.length > 0) {
				await batchCallback(result.contacts, batchNumber);
			}
			// Get the next page URL
			nextPageUrl = result.nextPageUrl;
		} while (nextPageUrl);

		return allContacts;
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
		const response = await this.httpClient.get(`/contact_lists`);
		return response.data.lists;
	}
}
