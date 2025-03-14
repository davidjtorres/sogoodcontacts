import { inject, injectable } from "inversify";
import { Db } from "mongodb";
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
}
