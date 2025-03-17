import { ObjectId } from "mongodb";

export function convertToDBObjectId(id: string): ObjectId {
	return new ObjectId(id);
}
