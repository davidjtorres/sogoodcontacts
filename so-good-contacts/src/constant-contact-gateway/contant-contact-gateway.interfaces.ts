interface EmailAddress {
	address: string;
	permission_to_send: "implicit" | "explicit";
}

interface CustomField {
	custom_field_id: string;
	value: string;
}

interface PhoneNumber {
	phone_number: string;
	kind: string;
}

interface StreetAddress {
	kind: string;
	street: string;
	city: string;
	state: string;
	postal_code: string;
	country: string;
}

interface Note {
	note_id: string;
	created_at: string;
	content: string;
}

interface SmsConsent {
	sms_consent_permission: "explicit" | "implicit";
	consent_type: string;
	consent_medium_details: string;
}

interface SmsChannel {
	full_sms_address: string;
	sms_channel_consents: SmsConsent[];
}

export interface IConstantContactApiContact {
	contact_id?: string;
	email_address: EmailAddress;
	first_name: string;
	last_name: string;
	job_title: string;
	company_name: string;
	create_source: string;
	birthday_month: number;
	birthday_day: number;
	anniversary: string;
	custom_fields: CustomField[];
	phone_numbers: PhoneNumber[];
	street_addresses: StreetAddress[];
	list_memberships: string[];
	taggings: string[];
	notes: Note[];
	sms_channel: SmsChannel;
}

export interface IConstantContactApiImportContact {

	email: string;
	first_name: string;
	last_name: string;
	job_title?: string;
	company_name?: string;


	birthday_month?: number;
	birthday_day?: number;
	anniversary?: string; 

	phone?: string;
	home_phone?: string;
	work_phone?: string;
	mobile_phone?: string;
	other_phone?: string;
	sms_number?: string;
	sms_consent_date?: string;


	street?: string;
	street2?: string;
	city?: string;
	state?: string;
	zip?: string;
	country?: string;

	home_street?: string;
	home_street2?: string;
	home_city?: string;
	home_state?: string;
	home_zip?: string;
	"home country"?: string; 


	work_street?: string;
	work_street2?: string;
	work_city?: string;
	work_state?: string;
	work_zip?: string;
	work_country?: string;


	other_street?: string;
	other_street2?: string;
	other_city?: string;
	other_state?: string;
	other_zip?: string;
	other_country?: string;


	[key: `cf:${string}`]: string;
}
