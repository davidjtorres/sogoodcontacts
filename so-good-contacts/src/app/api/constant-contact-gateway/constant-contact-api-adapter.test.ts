import { ConstantContactApiAdapter } from "./constant-contact-api-adapter";
import { Container } from "inversify";
import { ConstantContactApi } from "./constant-contact-api";

describe("ConstantContactApiAdapter", () => {
	let adapter: ConstantContactApiAdapter;
	let container: Container;
	let constantContactApiMock: ConstantContactApi;
	beforeAll(() => {
		container = new Container();
		constantContactApiMock = {
			getContacts: jest.fn().mockResolvedValue({
				contacts: [
					{
						first_name: "John",
						last_name: "Doe",
						email_address: {
							address: "john.doe@example.com",
						},
						phone_numbers: [
							{
								phone_number: "1234567890",
							},
						],
						street_addresses: [
							{
								street: "123 Main St",
								city: "Anytown",
								state: "CA",
								postal_code: "12345",
								country: "USA",
							},
						],
					},
				],
				nextPageUrl: null,
			}),
			getAllContacts: jest.fn().mockResolvedValue([]),
			createContact: jest.fn().mockResolvedValue({
				contact_id: "1234567890",
				first_name: "John",
				last_name: "Doe",
				email_address: {
					address: "john.doe@example.com",
				},
				phone_numbers: [
					{
						phone_number: "1234567890",
					},
				],
				street_addresses: [
					{
						street: "123 Main St",
						city: "Anytown",
						state: "CA",
						postal_code: "12345",
						country: "USA",
					},
				],
			}),
			importContacts: jest.fn(),
		} as unknown as ConstantContactApi;

		container.bind(ConstantContactApi).toConstantValue(constantContactApiMock);
		container.bind(ConstantContactApiAdapter).toSelf();
		adapter = container.get(ConstantContactApiAdapter);
	});

	it("should get contacts", async () => {
		const contacts = await adapter.getContacts();
		expect(contacts).toBeDefined();
		expect(contacts).toEqual([
			{
				user_id: null,
				first_name: "John",
				last_name: "Doe",
				email: "john.doe@example.com",
				phone_number: "1234567890",
				source: "constant_contact",
				address: {
					address_line_1: "123 Main St",
					city: "Anytown",
					state: "CA",
					zipcode: "12345",
					country: "USA",
				},
			},
		]);
	});

	it("should get all contacts in batches", async () => {
		const batchProcessor = jest.fn();
		const updatedAfter = "2021-01-01";
		const contacts = await adapter.getAllContactsInBatches(updatedAfter, batchProcessor);
		expect(contacts).toBeDefined();
		// expect(batchProcessor).toHaveBeenCalledWith(
		// 	[
		// 		{
		// 			user_id: null,
		// 			first_name: "John",
		// 			last_name: "Doe",
		// 			email: "john.doe@example.com",
		// 			phone_number: "1234567890",
		// 			source: "constant_contact",
		// 			address: {
		// 				address_line_1: "123 Main St",
		// 				city: "Anytown",
		// 				state: "CA",
		// 				zipcode: "12345",
		// 				country: "USA",
		// 			},
		// 		},
		// 	],
		// 	1
		// );
	});

	it("should create a contact", async () => {
		const contact = await adapter.createContact({
			user_id: "1412312313",
			first_name: "John",
			last_name: "Doe",
			email: "john.doe@example.com",
			phone_number: "1234567890",
			address: {
				address_line_1: "123 Main St",
				city: "Anytown",
				state: "CA",
				zipcode: "12345",
				country: "USA",
			},
		});

		expect(contact).toBeDefined();
		expect(contact.user_id).toBeDefined();
		expect(contact.first_name).toBe("John");
		expect(contact.last_name).toBe("Doe");
		expect(contact.email).toBe("john.doe@example.com");
		expect(contact.phone_number).toBe("1234567890");
		expect(contact.address).toBeDefined();
		expect(contact.address?.address_line_1).toBe("123 Main St");
		expect(contact.address?.city).toBe("Anytown");
		expect(contact.address?.state).toBe("CA");
		expect(contact.address?.zipcode).toBe("12345");
		expect(contact.address?.country).toBe("USA");
	});

	it("should import contacts", async () => {
		await adapter.importContacts([
			{
				email: "john.doe@example.com",
				first_name: "John",
				last_name: "Doe",
				phone_number: "1234567890",
				address: {
					address_line_1: "123 Main St",
					city: "Anytown",
					state: "CA",
					zipcode: "12345",
					country: "USA",
				},
				user_id: "1412312313",
			},
			{
				email: "jane.doe@example.com",
				first_name: "Jane",
				last_name: "Doe",
				phone_number: "1234567890",
				address: {
					address_line_1: "123 Main St",
					city: "Anytown",
					state: "CA",
					zipcode: "12345",
					country: "USA",
				},
				user_id: "1412312314",
			},
		], ["12312-1231-312312"]);

		expect(constantContactApiMock.importContacts).toHaveBeenCalledWith([
			{
				email: "john.doe@example.com",
				first_name: "John",
				last_name: "Doe",
				phone: "1234567890",
				street: "123 Main St",
				city: "Anytown",
				state: "CA",
				zip: "12345",
				country: "USA",
				"cf:integration_source": "so-good-contacts",
			},
			{
				email: "jane.doe@example.com",
				first_name: "Jane",
				last_name: "Doe",
				phone: "1234567890",
				street: "123 Main St",
				city: "Anytown",
				state: "CA",
				zip: "12345",
				country: "USA",
				"cf:integration_source": "so-good-contacts",
			},
		], ["12312-1231-312312"]);
	});
});
