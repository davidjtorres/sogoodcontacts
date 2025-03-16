export type User = {
	_id?: string; // Optional for new users
	name: string;
	email: string;
	constant_contact_token?: string;
	constant_contact_refresh_token?: string;
	last_synced_at?: Date;
};
