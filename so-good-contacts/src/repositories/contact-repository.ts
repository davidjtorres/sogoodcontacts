import { inject, injectable } from "inversify";
import { Db } from "mongodb";
import { Contact } from "@/models/contact";
import { IRepository } from "./interfaces";

@injectable()
export class ContactRepository implements IRepository<Contact> {
	private collection = "contacts";

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
		return this.db
			.collection<Contact>(this.collection)
			.find(query || {})
			.skip(skip || 0)
			.limit(limit || 50)
			.toArray();
	}

	async findOne(query: Record<string, unknown>): Promise<Contact | null> {
		return this.db.collection<Contact>(this.collection).findOne(query);
	}

	async update(query: Record<string, unknown>, data: Partial<Contact>): Promise<number> {
		const result = await this.db.collection<Contact>(this.collection).updateOne(query, { $set: data });
		return result.modifiedCount;
	}

	async delete(query: Record<string, unknown>): Promise<number> {
		const result = await this.db.collection<Contact>(this.collection).deleteOne(query);
		return result.deletedCount;
	}
}
