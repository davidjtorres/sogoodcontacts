import { ConstantContactApi } from "./constant-contact-api";
import type { AxiosInstance, AxiosRequestConfig } from "axios";
import type { IConstantContactApiContact } from "./contant-contact-gateway.interfaces";

describe("ConstantContactApi", () => {
	let constantContactApi: ConstantContactApi;
	let axiosInstance: AxiosInstance;
	let requestInterceptorCallback: (config: AxiosRequestConfig) => AxiosRequestConfig;
	const token = "test-token";
	beforeAll(() => {
		requestInterceptorCallback = (config: AxiosRequestConfig) => config;
		axiosInstance = {
			interceptors: {
				request: {
					use: jest.fn((callback) => {
						requestInterceptorCallback = callback;
						return 1;
					}),
				},
			},
			get: jest.fn(),
			post: jest.fn(),
			data: {
				contacts: [],
			},
		} as unknown as AxiosInstance;

		constantContactApi = new ConstantContactApi(axiosInstance, token);
	});

	it("should add Authorization and Content-Type headers to requests via interceptor", () => {
		// Create a mock request config
		const mockConfig: AxiosRequestConfig = {
			url: "/contacts",
			method: "get",
			headers: {},
		};

		// Call the interceptor callback with the mock config
		const modifiedConfig = requestInterceptorCallback(mockConfig);

		// Verify that the headers were added correctly
		expect(modifiedConfig?.headers?.Authorization).toBe(`Bearer ${token}`);
		expect(modifiedConfig?.headers?.["Content-Type"]).toBe("application/json");
	});

	it("should be defined", () => {
		expect(ConstantContactApi).toBeDefined();
	});

	it("should get contacts", async () => {
		const mockContacts = [
			{
				email_address: {
					address: "david@davidtorres.co",
					permission_to_send: "explicit",
				},
			},
		];
		(axiosInstance.get as jest.Mock).mockResolvedValue({
			data: {
				contacts: mockContacts,
			},
		});
		const contacts = await constantContactApi.getContacts();
		expect(contacts).toBeDefined();
		expect(contacts).toEqual({
			contacts: mockContacts,
			nextPageUrl: null,
		});
	});

	it("should get contacts with updated_after", async () => {
		const mockContacts = [
			{
				email_address: {
					address: "david@davidtorres.co",
					permission_to_send: "explicit",
				},
			},
		];
		(axiosInstance.get as jest.Mock).mockResolvedValue({
			data: {
				contacts: mockContacts,
			},
		});
		const contacts = await constantContactApi.getContacts("2025-01-01");
		expect(contacts).toBeDefined();
		expect(contacts).toEqual({
			contacts: mockContacts,
			nextPageUrl: null,
		});
	});

	it("should get contact lists", async () => {
		const mockContactLists = [
			{
				id: "3d0239cc-fb96-11ef-a1b4-fa163e123590",
				name: "Test List",
			},
		];
		(axiosInstance.get as jest.Mock).mockResolvedValue({
			data: {
				lists: mockContactLists,
			},
		});
		const contactLists = await constantContactApi.getContactLists();
		expect(contactLists).toBeDefined();
		expect(contactLists).toEqual(mockContactLists);
	});

	it("should create contact", async () => {
		const mockContact: IConstantContactApiContact = {
			email_address: {
				address: "david@davidtorres.co",
				permission_to_send: "explicit",
			},
			first_name: "Joe",
			last_name: "Bloggs",
			job_title: "Software Engineer",
			company_name: "Atmosphere",
			create_source: "Account",
			custom_fields: [],
			phone_numbers: [],
			street_addresses: [],
			anniversary: "2025-01-01",
			list_memberships: ["3d0239cc-fb96-11ef-a1b4-fa163e123590"],
			taggings: [],
			notes: [],
			birthday_month: 1,
			birthday_day: 1,
			sms_channel: {
				full_sms_address: "1234567890",
				sms_channel_consents: [],
			},
		};
		(axiosInstance.post as jest.Mock).mockResolvedValue({
			data: {
				...mockContact,
				contact_id: "3d0239cc-fb96-11ef-a1b4-fa163e123590",
			},
		});
		const contact = await constantContactApi.createContact(mockContact);
		expect(contact).toBeDefined();
		expect(contact).toEqual({
			...mockContact,
			contact_id: "3d0239cc-fb96-11ef-a1b4-fa163e123590",
		});
	});

	it("should import contacts", async () => {
		const mockImport = {
			email: "david@davidtorres.co",
			first_name: "Joe",
			last_name: "Bloggs",
			job_title: "Software Engineer",
			company_name: "Atmosphere",
			work_street: "12345",
			work_street2: "Test",
			work_city: "Test",
			work_state: "CA",
			work_zip: "12345",
			work_country: "US",
			anniversary: "2025-01-01",
		};
		(axiosInstance.post as jest.Mock).mockResolvedValue({
			data: mockImport,
		});
		const contacts = await constantContactApi.importContacts([mockImport], ["3d0239cc-fb96-11ef-a1b4-fa163e123590"]);
		expect(contacts).toBeDefined();
		expect(contacts).toEqual(mockImport);
	});
});
