import { ContactRepository } from "@/app/api/repositories/contact-repository";
import { UserRepository } from "@/app/api/repositories/user-repository";
import { ConstantContactApiAdapter } from "@/app/api/constant-contact-gateway/constant-contact-api-adapter";
import { ContactsService } from "./contacts-service";
import { PassThrough, Readable } from "stream";
import { Container } from "inversify";
import { jobStatusTracker } from "./job-status-tracker";

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

	beforeEach(() => {
		// Reset mocks

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

	it("should create a contact", async () => {
		const mockContact = {
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
		};
		mockContactRepository.create.mockResolvedValue("test-contact-id");
		const result = await contactsService.createContact(mockContact);
		expect(result).toEqual("test-contact-id");
	});

	it("should get contacts with pagination", async () => {
		const mockContact = {
			user_id: testUserId,
			first_name: "John",
			last_name: "Doe",
			email: "john.doe@example.com",
			phone_number: "123-456-7890",
		};
		mockContactRepository.findWithPagination.mockResolvedValue({
			contacts: [mockContact],
			totalCount: 0,
			totalPages: 0,
			currentPage: 1,
		});
		const result = await contactsService.getContactsWithPagination(testUserId, 1, 10, "_id", 1);
		expect(mockContactRepository.findWithPagination).toHaveBeenCalledWith({ user_id: testUserId }, 1, 10, "_id", 1);
		expect(result).toEqual({
			contacts: [mockContact],
			totalCount: 0,
			totalPages: 0,
			currentPage: 1,
		});
	});

	it("should import contacts from a CSV stream", async () => {
		const mockCSVContent =
			"first_name,last_name,email,phone_number,address_line_1,address_line_2,city,state,zipcode,country\nJohn,Doe,john@example.com,123-456-7890,123 Main St,Apt 4B,New York,NY,10001,USA";
		function createMockCSVStream(csvContent: string): Readable {
			const stream = new PassThrough();
			csvContent.split("\n").forEach((line) => stream.push(line + "\n"));
			stream.push(null); // End stream
			return stream;
		}

		const mockCSVStream = createMockCSVStream(mockCSVContent);

		const result = await contactsService.importContactsFromCSV({
			stream: mockCSVStream,
			userId: testUserId,
			importToConstantContact: true,
			constantContactListsIds: ["3d0239cc-fb96-11ef-a1b4-fa163e123590"],
		});
		expect(result).toEqual({
			success: true,
			importedCount: 1,
		});
	});

	it("should import contacts from a CSV stream without constant contact", async () => {
		const mockCSVContent =
			"first_name,last_name,email,phone_number,address_line_1,address_line_2,city,state,zipcode,country\nJohn,Doe,john@example.com,123-456-7890,123 Main St,Apt 4B,New York,NY,10001,USA";
		function createMockCSVStream(csvContent: string): Readable {
			const stream = new PassThrough();
			csvContent.split("\n").forEach((line) => stream.push(line + "\n"));
			stream.push(null); // End stream
			return stream;
		}

		const mockCSVStream = createMockCSVStream(mockCSVContent);

		const result = await contactsService.importContactsFromCSV({
			stream: mockCSVStream,
			userId: testUserId,
			importToConstantContact: false,
			constantContactListsIds: [],
		});
		expect(result).toEqual({
			success: true,
			importedCount: 1,
		});
	});

	it("should sync contacts from Constant Contact", async () => {
		const mockUser = {
			id: testUserId,
			last_synced_at: new Date(),
			name: "John Doe",
			email: "john.doe@example.com",
		};
		mockUserRepository.findOne.mockResolvedValue(mockUser);
		mockConstantContactAdapter.getContacts.mockResolvedValue([
			{
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
			},
		]);
		mockContactRepository.create.mockResolvedValue("test-contact-id");
		mockUserRepository.update.mockResolvedValue({
			modifiedCount: 1,
		});
		const result = await contactsService.syncConstantContactContacts(mockUser);
		expect(result).toEqual({
			success: true,
			count: 1,
			last_synced_at: expect.any(String),
		});
	});

	it("should start sync from constant contact", async () => {
		const mockUser = {
			id: testUserId,
			name: "John Doe",
			email: "john.doe@example.com",
		};
		mockUserRepository.findOne.mockResolvedValue(mockUser);
		(mockConstantContactAdapter.getContacts as jest.Mock).mockResolvedValue([
			{
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
			},
		]);
		(mockConstantContactAdapter.getAllContactsInBatches as jest.Mock) = jest.fn((updated_after, batchProcessor) => {
			batchProcessor(
				[
					{
						first_name: "John",
						last_name: "Doe",
						email: "john.doe@example.com",
						phone_number: "123-456-7890",
						address_line_1: "123 Main St",
						address_line_2: "Apt 4B",
						city: "New York",
						state: "NY",
						zipcode: "10001",
						country: "USA",
					},
				],
				1
			);
		});
		mockContactRepository.create.mockResolvedValue("test-contact-id");
		mockUserRepository.update.mockResolvedValue({
			modifiedCount: 1,
		});
		const result = await contactsService.startBulkConstantContactSync(mockUser);
		expect(result).toEqual({
			success: true,
			message: "Bulk sync started. This process will continue in the background.",
			job_id: expect.any(String),
			status: "started",
		});
	});

	it("should start sync from constant contact with error", async () => {
		const mockUser = {
			id: testUserId,
			name: "John Doe",
			email: "john.doe@example.com",
		};
		jest.spyOn(jobStatusTracker, "updateJob");
		mockUserRepository.findOne.mockResolvedValue(mockUser);
		mockConstantContactAdapter.getContacts.mockResolvedValue([]);
		(mockConstantContactAdapter.getAllContactsInBatches as jest.Mock) = jest.fn((updated_after, batchProcessor) => {
			batchProcessor(
				[
					{
						first_name: "John",
						last_name: "Doe",
						email: "john.doe@example.com",
						phone_number: "123-456-7890",
						address_line_1: "123 Main St",
						address_line_2: "Apt 4B",
						city: "New York",
						state: "NY",
						zipcode: "10001",
						country: "USA",
					},
				],
				1
			);
		});
		mockContactRepository.create.mockRejectedValue(new Error("Error creating contacts"));
		mockUserRepository.update.mockResolvedValue({
			modifiedCount: 1,
		});
		await contactsService.startBulkConstantContactSync(mockUser);
		expect(jobStatusTracker.updateJob).toHaveBeenCalledWith(expect.any(String), {
			failed_contacts: 1,
		});
	});

	it("should start sync from constant contact with error", async () => {
		const mockUser = {
			id: testUserId,
			name: "John Doe",
			email: "john.doe@example.com",
		};
		jest.spyOn(jobStatusTracker, "failJob");
		mockUserRepository.findOne.mockResolvedValue(mockUser);
		mockConstantContactAdapter.getContacts.mockResolvedValue([]);
		(mockConstantContactAdapter.getAllContactsInBatches as jest.Mock).mockRejectedValue(
			new Error("Error fetching contacts")
		);
		mockContactRepository.create.mockRejectedValue(new Error("Error creating contacts"));
		mockUserRepository.update.mockResolvedValue({
			modifiedCount: 1,
		});
		await contactsService.startBulkConstantContactSync(mockUser);
		expect(jobStatusTracker.failJob).toHaveBeenCalledWith(expect.any(String), "Error fetching contacts");
	});

	it("should get the status of a bulk sync job", async () => {
		jest.spyOn(jobStatusTracker, "getJob").mockReturnValue({
			job_id: "test-job-id",
			status: "started",
			type: "bulk_sync",
			total_contacts: 1,
			processed_contacts: 200,
			failed_contacts: 0,
			progress_percentage: 100,
			last_updated: expect.any(Date),
			start_time: expect.any(Date),
		});
		const result = await contactsService.getBulkSyncStatus("test-job-id");
		expect(result).toEqual({
			job_id: "test-job-id",
			status: "started",
			type: "bulk_sync",
			total_contacts: 1,
			processed_contacts: 200,
			failed_contacts: 0,
			progress_percentage: 100,
			start_time: expect.any(Date),
			last_updated: expect.any(Date),
		});
	});

	it("should export contacts to CSV", async () => {
		const mockReadable = new Readable();
		(mockContactRepository.exportContactsToCSV as jest.Mock).mockResolvedValue(mockReadable);
		const result = await contactsService.exportContacts();
		expect(result).toEqual(mockReadable);
	});
});
