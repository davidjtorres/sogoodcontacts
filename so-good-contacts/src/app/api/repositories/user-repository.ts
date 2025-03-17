import { injectable, inject } from "inversify";
import { ObjectId, Db } from "mongodb";
import { IRepository } from "./interfaces";

export type User = {
	id?: string | ObjectId;
	_id?: ObjectId;
	name: string;
	email: string;
	constant_contact_token?: string;
	created_at?: Date;
	updated_at?: Date;
};

@injectable()
export class UserRepository implements IRepository<User> {
	private readonly collectionName = "users";

	constructor(@inject("Database") private db: Db) {}

	async create(data: User | User[]): Promise<string | string[]> {
		const now = new Date();

		if (Array.isArray(data)) {
			const usersToInsert = data.map((user) => ({
				...user,
				created_at: now,
				updated_at: now,
			}));

			const result = await this.db.collection(this.collectionName).insertMany(usersToInsert);
			return Object.values(result.insertedIds).map((id) => id.toString());
		}

		const userToInsert = {
			...data,
			created_at: now,
			updated_at: now,
		};

		const result = await this.db.collection(this.collectionName).insertOne(userToInsert);
		return result.insertedId.toString();
	}

	async findAll(query?: Record<string, unknown>): Promise<User[]> {
		const users = await this.db
			.collection(this.collectionName)
			.find(query || {})
			.toArray();

		return users.map((user) => ({
			...user,
			id: user._id.toString(),
		})) as User[];
	}

	async findOne(query: Record<string, unknown>): Promise<User | null> {
		const user = await this.db.collection(this.collectionName).findOne(query);

		if (!user) {
			return null;
		}

		return {
			...user,
			id: user._id.toString(),
		} as User;
	}

	async update(query: Record<string, unknown>, data: Partial<User>): Promise<{ modifiedCount: number }> {
		const result = await this.db.collection(this.collectionName).updateOne(query, {
			$set: {
				...data,
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

}
