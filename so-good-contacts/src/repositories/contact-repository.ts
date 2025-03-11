import { inject, injectable } from "inversify";
import { Db } from "mongodb";
import { Contact } from "@/models/contact";
import { IRepository } from "./interfaces";

@injectable()
export class ContactRepository implements IRepository<Contact> {
  private collection = "contacts";

  constructor(@inject("Database") private db: Db) {}

  async create(contact: Contact): Promise<Contact> {
    const result = await this.db.collection<Contact>(this.collection).insertOne(contact);
    return { ...contact, id: result.insertedId.toString() };
  }

  async findAll(query?: Record<string, unknown>): Promise<Contact[]> {
    return this.db.collection<Contact>(this.collection).find(query || {}).toArray();
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
