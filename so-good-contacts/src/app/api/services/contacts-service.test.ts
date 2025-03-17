import { Contact } from "@/app/api/models/contact";
import { User } from "@/app/api/models/user";
import { ContactRepository } from "@/app/api/repositories/contact-repository";
import { UserRepository } from "@/app/api/repositories/user-repository";
import { ConstantContactApiAdapter } from "@/app/api/constant-contact-gateway/constant-contact-api-adapter";
import { ContactsService, CONTACT_CSV_HEADERS } from "./contacts-service";
import { Readable } from "stream";
import * as csvParser from "@/app/api/utils/csv-parser";
import { CSVRecord } from "@/app/api/utils/csv-parser";
import { Container } from "inversify";

// Define interfaces for private methods
interface ContactsServicePrivate {
	transformCSVToContacts(csvRecords: CSVRecord[], userId: string): Contact[];
	createContactsInBackground(contacts: Contact[], importToConstantContact: boolean): Promise<void>;
}

// Mock the dependencies
jest.mock("@/app/api/repositories/contact-repository");
jest.mock("@/app/api/repositories/user-repository");
jest.mock("@/app/api/constant-contact-gateway/constant-contact-api-adapter");
jest.mock("@/app/api/utils/csv-parser");
jest.mock("@/app/api/database/utils", () => ({
	convertToDBObjectId: jest.fn((id) => id), // Mock to return the same id
}));

describe("ContactsService", () => {
	// Create a container for dependency injection
	let container: Container;
	let contactsService: ContactsService;
	let mockContactRepository: jest.Mocked<ContactRepository>;
	let mockUserRepository: jest.Mocked<UserRepository>;
	let mockConstantContactAdapter: jest.Mocked<ConstantContactApiAdapter>;

	// Test data
	const testUserId = "test-user-id";
	const testContact: Contact = {
		user_id: testUserId,
		first_name: "John",
		last_name: "Doe",
		email: "john.doe@example.com",
		phone_number: "123-456-7890",
		address: {
			address_line_1: "123 Main St",
			address_line_2: "Apt 4B",
			city: "New York",
			state: "NY",
			zipcode: "10001",
			country: "USA",
		},
		source: "so_good_contacts",
	};

	beforeEach(() => {
		// Reset mocks
		jest.clearAllMocks();

		// Create inversify container
		container = new Container();

		// Set up mock implementations
		const ContactRepositoryMock = jest.requireMock("@/app/api/repositories/contact-repository").ContactRepository;
		const UserRepositoryMock = jest.requireMock("@/app/api/repositories/user-repository").UserRepository;
		const ConstantContactApiAdapterMock = jest.requireMock(
			"@/app/api/constant-contact-gateway/constant-contact-api-adapter"
		).ConstantContactApiAdapter;

		// Create mocked instances
		mockContactRepository = new ContactRepositoryMock() as jest.Mocked<ContactRepository>;
		mockUserRepository = new UserRepositoryMock() as jest.Mocked<UserRepository>;
		mockConstantContactAdapter = new ConstantContactApiAdapterMock() as jest.Mocked<ConstantContactApiAdapter>;

		// Bind mocks to the container
		container.bind(ContactRepository).toConstantValue(mockContactRepository);
		container.bind(UserRepository).toConstantValue(mockUserRepository);
		container.bind(ConstantContactApiAdapter).toConstantValue(mockConstantContactAdapter);
		container.bind(ContactsService).toSelf();

		// Get service instance from container
		contactsService = container.get(ContactsService);
	});

	describe("getContacts", () => {
		it("should retrieve contacts for a user", async () => {
			// Arrange
			const expectedContacts = [testContact];
			mockContactRepository.findAll = jest.fn().mockResolvedValue(expectedContacts);

			// Act
			const result = await contactsService.getContacts(testUserId);

			// Assert
			expect(mockContactRepository.findAll).toHaveBeenCalledWith({ user_id: testUserId });
			expect(result).toEqual(expectedContacts);
		});
	});

	describe("getContactsWithPagination", () => {
		it("should retrieve paginated contacts", async () => {
			// Arrange
			const paginatedResult = {
				contacts: [testContact],
				totalCount: 1,
				currentPage: 2,
				totalPages: 5,
			};
			mockContactRepository.findWithPagination = jest.fn().mockResolvedValue(paginatedResult);

			// Act
			const result = await contactsService.getContactsWithPagination(testUserId, 2, 10, "first_name", 1);

			// Assert
			expect(mockContactRepository.findWithPagination).toHaveBeenCalledWith(
				{ user_id: testUserId },
				2,
				10,
				"first_name",
				1
			);
			expect(result).toEqual(paginatedResult);
		});

		it("should throw an error if userId is not provided", async () => {
			// Act & Assert
			await expect(contactsService.getContactsWithPagination(undefined)).rejects.toThrow("User ID is required");
		});
	});

	describe("createContact", () => {
		it("should create a new contact", async () => {
			// Arrange
			mockContactRepository.create = jest.fn().mockResolvedValue([testContact]);

			// Act
			const result = await contactsService.createContact(testContact);

			// Assert
			expect(mockContactRepository.create).toHaveBeenCalledWith(testContact);
			expect(result).toEqual([testContact]);
		});

		it("should create multiple contacts", async () => {
			// Arrange
			const contacts = [testContact, { ...testContact, email: "jane@example.com" }];
			mockContactRepository.create = jest.fn().mockResolvedValue(contacts);

			// Act
			const result = await contactsService.createContact(contacts);

			// Assert
			expect(mockContactRepository.create).toHaveBeenCalledWith(contacts);
			expect(result).toEqual(contacts);
		});
	});

	describe("importContactsFromCSV", () => {
		it("should import contacts from a CSV stream", async () => {
			// Arrange
			const csvStream = Readable.from("csv data");
			const csvRecords = [{ first_name: "John", last_name: "Doe", email: "john@example.com" } as CSVRecord];

			// Mock CSV parsing
			jest.spyOn(csvParser, "parseCSVStream").mockResolvedValue({
				data: csvRecords,
				count: csvRecords.length,
				success: true,
			});

			// Mock private methods using prototype access and the defined interface
			jest
				.spyOn(ContactsService.prototype as unknown as ContactsServicePrivate, "transformCSVToContacts")
				.mockReturnValue([testContact]);

			jest
				.spyOn(ContactsService.prototype as unknown as ContactsServicePrivate, "createContactsInBackground")
				.mockImplementation(jest.fn());

			// Act
			const result = await contactsService.importContactsFromCSV(csvStream, testUserId, false);

			// Assert
			expect(csvParser.parseCSVStream).toHaveBeenCalledWith(csvStream, CONTACT_CSV_HEADERS);
			expect(result).toEqual({
				success: true,
				importedCount: csvRecords.length,
				invalidCount: 0,
				sampleData: csvRecords.slice(0, 5),
				importToConstantContact: false,
			});
		});
	});

	describe("syncConstantContactContacts", () => {
		it("should sync contacts from Constant Contact", async () => {
			// Arrange
			const testUser: User = {
				id: testUserId,
				name: "Test User",
				email: "test@example.com",
				last_synced_at: new Date("2023-01-01"),
			};

			const constantContactContacts = [
				{
					first_name: "CC",
					last_name: "User",
					email: "cc@example.com",
					user_id: "",
					source: "constant_contact",
				} as Contact,
			];

			// Mock date for consistent testing
			const mockNow = new Date("2023-02-01T12:00:00.000Z");
			// Use type assertion to avoid 'any'
			jest.spyOn(global, "Date").mockImplementation((): Date => mockNow);

			// Set up mock implementations
			mockConstantContactAdapter.getContacts = jest.fn().mockResolvedValue(constantContactContacts);
			mockContactRepository.create = jest.fn().mockResolvedValue(constantContactContacts);
			mockUserRepository.update = jest.fn().mockResolvedValue({ modifiedCount: 1 });

			// Act
			const result = await contactsService.syncConstantContactContacts(testUser);

			// Assert
			expect(mockConstantContactAdapter.getContacts).toHaveBeenCalledWith(expect.any(String));
			expect(mockContactRepository.create).toHaveBeenCalled();
			expect(mockUserRepository.update).toHaveBeenCalledWith({ _id: testUserId }, { last_synced_at: mockNow });
			expect(result).toEqual({
				success: true,
				count: constantContactContacts.length,
				last_synced_at: mockNow.toISOString(),
			});

			// Restore mocks
			jest.restoreAllMocks();
		});
	});
});
