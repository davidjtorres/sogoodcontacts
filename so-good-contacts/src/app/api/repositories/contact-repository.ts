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
		const contacts = await this.findWithCursor({ user_id: new ObjectId(userId) });
		return contacts.contacts;
	}

	async findWithCursor(
		query: Record<string, unknown> = {},
		limit: number = 20,
		cursor?: string,
		sortField: string = "_id",
		sortDirection: 1 | -1 = 1
	): Promise<{ contacts: Contact[]; nextCursor: string | null }> {
		// Create a copy of the query to avoid modifying the original
		const queryWithCursor = { ...query };

		// If cursor is provided, add it to the query
		if (cursor) {
			// Convert cursor to ObjectId if the sort field is _id
			const cursorValue = sortField === "_id" ? new ObjectId(cursor) : cursor;

			// Add cursor condition to query based on sort direction
			if (sortDirection === 1) {
				queryWithCursor[sortField] = { $gt: cursorValue };
			} else {
				queryWithCursor[sortField] = { $lt: cursorValue };
			}
		}

		// Execute the query with sorting and limit
		const contacts = await this.db
			.collection<Contact>(this.collection)
			.find(queryWithCursor)
			.sort({ [sortField]: sortDirection })
			.limit(limit + 1) // Fetch one extra to determine if there are more results
			.toArray();

		// Determine if there are more results
		const hasMore = contacts.length > limit;
		// Remove the extra item if there are more results
		const paginatedContacts = hasMore ? contacts.slice(0, limit) : contacts;

		// Get the next cursor from the last item
		let nextCursor = null;
		if (hasMore && paginatedContacts.length > 0) {
			const lastItem = paginatedContacts[paginatedContacts.length - 1];
			nextCursor =
				sortField === "_id"
					? lastItem._id.toString()
					: lastItem[sortField as keyof typeof lastItem] != null
					? String(lastItem[sortField as keyof typeof lastItem])
					: null;
		}

		// Map the contacts to include string IDs
		const mappedContacts = paginatedContacts.map((contact) => ({
			...contact,
			id: contact._id.toString(),
		}));

		return {
			contacts: mappedContacts,
			nextCursor,
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
