import { ObjectId } from "mongodb";

export type Contact = {
	id?: string | ObjectId;
	user_id: string | null | ObjectId;
	first_name: string;
	last_name: string;
	phone_number?: string;
	email: string;
	address?: {
		address_line_1: string;
		address_line_2?: string;
		city: string;
		state: string;
		zipcode: string;
		country: string;
	};
	source?: "constant_contact" | "so_good_contacts";
}
