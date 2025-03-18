import { inject, injectable } from "inversify";
import { Db, ObjectId } from "mongodb";
import { Contact } from "@/app/api/models/contact";
import { IRepository } from "./interfaces";

@injectable()
export class ContactRepository implements IRepository<Contact> {
	private readonly collection = "contacts";

	constructor(@inject("Database") private db: Db) {}

	async create(contact: Contact | Contact[]): Promise<string | string[]> {
		if (Array.isArray(contact)) {
			const result = await this.db.collection<Contact>(this.collection).insertMany(contact);

			const ids = Object.values(result.insertedIds);
			return ids.map((id) => id.toString());
		}
		const result = await this.db.collection<Contact>(this.collection).insertOne(contact);
		const id = result.insertedId.toString();
		return id;
	}

	async findAll(query?: Record<string, unknown>, skip?: number, limit?: number): Promise<Contact[]> {
		const contacts = await this.db
			.collection<Contact>(this.collection)
			.find(query || {})
			.skip(skip || 0)
			.limit(limit || 50)
			.toArray();

		return contacts.map((contact) => ({ ...contact, id: contact._id.toString() }));
	}

	async findByUserId(userId: string): Promise<Contact[]> {
		const result = await this.findWithPagination({ user_id: new ObjectId(userId) });
		return result.contacts;
	}

	/**
	 * Find contacts with pagination using MongoDB $facet for efficiency
	 * @param query Query to filter contacts
	 * @param page Page number (1-based)
	 * @param pageSize Number of items per page
	 * @param sortField Field to sort by
	 * @param sortDirection Sort direction (1 for ascending, -1 for descending)
	 * @returns Paginated contacts with metadata
	 */
	async findWithPagination(
		query: Record<string, unknown> = {},
		page: number = 1,
		pageSize: number = 20,
		sortField: string = "_id",
		sortDirection: 1 | -1 = 1
	): Promise<{ contacts: Contact[]; totalCount: number; totalPages: number; currentPage: number }> {
		// Ensure page is at least 1
		const currentPage = Math.max(1, page);
		// Calculate skip value based on page and pageSize
		const skip = (currentPage - 1) * pageSize;

		// Use $facet to get both data and count in a single query
		const result = await this.db
			.collection<Contact>(this.collection)
			.aggregate([
				// Match stage - apply the query filter
				{ $match: query },
				// Facet stage - run multiple aggregation pipelines
				{
					$facet: {
						// Pipeline for paginated data
						data: [
							// Sort the documents
							{ $sort: { [sortField]: sortDirection } },
							// Skip for pagination
							{ $skip: skip },
							// Limit the number of documents
							{ $limit: pageSize }
						],
						// Pipeline for total count
						count: [
							// Count the total documents
							{ $count: "total" }
						]
					}
				}
			])
			.toArray();

		// Extract data and count from result
		const facetResult = result[0];
		const contacts = facetResult.data || [];
		const totalCount = facetResult.count[0]?.total || 0;
		const totalPages = Math.ceil(totalCount / pageSize);

		// Map the contacts to include string IDs
		const mappedContacts = contacts.map((contact: { _id: ObjectId } & Omit<Contact, 'id'>) => ({
			...contact,
			id: contact._id.toString()
		}));

		return {
			contacts: mappedContacts,
			totalCount,
			totalPages,
			currentPage
		};
	}

	async findOne(query: Record<string, unknown>): Promise<Contact | null> {
		const contact = await this.db.collection<Contact>(this.collection).findOne(query);
		return contact ? { ...contact, id: contact._id.toString() } : null;
	}

	async update(query: Record<string, unknown>, data: Partial<Contact>) {
		const result = await this.db.collection<Contact>(this.collection).updateOne(query, { $set: data });
		return { modifiedCount: result.modifiedCount };
	}

	async delete(query: Record<string, unknown>) {
		const result = await this.db.collection<Contact>(this.collection).deleteOne(query);
		return { deletedCount: result.deletedCount };
	}

	/**
	 * Export contacts to CSV using streams for memory efficiency
	 * @returns A ReadableStream containing the CSV data
	 */
	async exportContactsToCSV(): Promise<ReadableStream> {
		// Helper function to escape CSV fields
		function escapeCsvField(field: string): string {
			// If the field contains commas, quotes, or newlines, wrap it in quotes
			if (/[",\n\r]/.test(field)) {
				// Replace any quotes with double quotes
				return `"${field.replace(/"/g, '""')}"`;
			}
			return field;
		}

		const start = async (controller: ReadableStreamDefaultController) => {
			try {
				// Add CSV header
				const headers = [
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
				].join(",");

				// Encode and send the header
				controller.enqueue(new TextEncoder().encode(headers + "\n"));

				// Process contacts in batches for efficiency
				const BATCH_SIZE = 50;
				let lastId: ObjectId | null = null;
				while (true) {
					const batchQuery: Record<string, unknown> = {};
					if (lastId) {
						batchQuery._id = { $gt: lastId };
					}

					// Get a fresh batch with a new cursor each time
					const contacts = await this.db
						.collection<Contact>(this.collection)
						.find(batchQuery)
						.sort({ _id: 1 })
						.limit(BATCH_SIZE)
						.toArray();

					// console.log(contacts);
					// Exit the loop if no more contacts
					if (contacts.length === 0) break;

					// Update lastId for the next batch
					lastId = contacts[contacts.length - 1]._id;

					// Process each contact in the batch
					for (const contact of contacts) {
						// Format address fields
						const address = contact.address;

						// Create CSV row
						const row = [
							escapeCsvField(contact.first_name || ""),
							escapeCsvField(contact.last_name || ""),
							escapeCsvField(contact.email || ""),
							escapeCsvField(contact.phone_number || ""),
							escapeCsvField(address?.address_line_1 || ""),
							escapeCsvField(address?.address_line_2 || ""),
							escapeCsvField(address?.city || ""),
							escapeCsvField(address?.state || ""),
							escapeCsvField(address?.zipcode || ""),
							escapeCsvField(address?.country || ""),
						].join(",");

						// Encode and send the row
						controller.enqueue(new TextEncoder().encode(row + "\n"));
					}
				}

				controller.close();
			} catch (error) {
				console.error("Error generating CSV:", error);
				controller.error(error);
			}
		};

		// Create a ReadableStream
		return new ReadableStream({ start });
	}
}
