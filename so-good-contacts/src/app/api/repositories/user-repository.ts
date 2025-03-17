import { injectable, inject } from "inversify";
import { ObjectId, Db } from "mongodb";
import { IRepository } from "./interfaces";
import { User } from "@/app/api/models/user";


@injectable()
export class UserRepository implements IRepository<User> {
	private readonly collectionName = "users";

	constructor(@inject("Database") private db: Db) {}

	async create(data: User): Promise<string | string[]> {

		const result = await this.db.collection<User>(this.collectionName).insertOne(data);
		return result.insertedId.toString();
	}

	async findAll(query?: Record<string, unknown>): Promise<User[]> {
		const users = await this.db.collection<User>(this.collectionName).find(query || {}).toArray();

		return users.map((user) => {
			const { _id, ...rest } = user;
			const idString = _id?.toString();
			return {
				...rest,
				_id: idString,
				id: idString,
			} as User;
		});
	}

	async findOne(query: Record<string, unknown>): Promise<User | null> {
		const user = await this.db.collection<User>(this.collectionName).findOne(query);
		if (!user) {
			return null;
		}
		const { _id, ...rest } = user;
		const idString = _id?.toString();
		return {
			...rest,
			_id: idString,
			id: idString,
		} as User;
	}

	async update(query: Record<string, unknown>, data: Partial<User>): Promise<{ modifiedCount: number }> {
		// Remove _id from data if it exists to avoid MongoDB errors
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const { _id, id, ...updateData } = data;
		const result = await this.db.collection(this.collectionName).updateOne(query, {
			$set: {
				...updateData,
				updated_at: new Date(),
			},
		});
		return { modifiedCount: result.modifiedCount };
	}

	async delete(query: Record<string, unknown>): Promise<{ deletedCount: number }> {
		const result = await this.db.collection(this.collectionName).deleteOne(query);
		return { deletedCount: result.deletedCount };
	}

	// Helper methods specific to User entity
	async findById(id: string): Promise<User | null> {
		try {
			const objectId = new ObjectId(id);
			return this.findOne({ _id: objectId });
		} catch {
			return null;
		}
	}

	async findByEmail(email: string): Promise<User | null> {
		return this.findOne({ email });
	}
}
