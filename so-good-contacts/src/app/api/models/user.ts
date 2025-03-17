import { ObjectId } from "mongodb";

export type User = {
	_id?: string; // Optional for new users
	id?: string | ObjectId; // Alias for _id, used in some parts of the application
	name: string;
	email: string;
	constant_contact_token?: string;
	constant_contact_refresh_token?: string;
	last_synced_at?: Date;
};
