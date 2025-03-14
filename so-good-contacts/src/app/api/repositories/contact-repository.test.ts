import { Db, ObjectId, WithId } from "mongodb";
import { ContactRepository } from "./contact-repository";
import { Contact } from "@/app/api/models/contact";
import { before } from "node:test";
import { Container } from "inversify";

describe("ContactRepository", () => {
	let db: Db;
	let contactRepository: ContactRepository;
	const collectionName = "contacts";
	let container: Container;

	before(() => {
		db = {
			collection: jest.fn().mockReturnValue({
				insertMany: jest.fn(),
				insertOne: jest.fn(),
				find: jest.fn().mockReturnValue({
					skip: jest.fn().mockReturnValue({
						limit: jest.fn().mockReturnValue({
							toArray: jest.fn(),
						}),
					}),
				}),
				findOne: jest.fn(),
				updateOne: jest.fn(),
				deleteOne: jest.fn(),
			}),
		} as unknown as Db;

		container = new Container();
		container.bind("Database").toConstantValue(db);
		container.bind<ContactRepository>(ContactRepository).toSelf();

		contactRepository = container.get(ContactRepository);
	});

	it("should create a single contact", async () => {
		const contact: Contact = {
			first_name: "John",
			last_name: "Doe",
			email: "john@example.com",
			user_id: "12345",
			address: { address_line_1: "123 Main St", city: "Anytown", state: "CA", zipcode: "12345", country: "USA" },
		};

		(db.collection(collectionName).insertOne as jest.Mock).mockResolvedValue({
			insertedId: {
				toString: jest.fn().mockReturnValue("12345"),
			},
		});

		const result = await contactRepository.create(contact);
		expect(result).toEqual("12345");
		expect(db.collection(collectionName).insertOne).toHaveBeenCalledWith(contact);
	});

	it("should create multiple contacts", async () => {
		const contacts: Contact[] = [
			{
				first_name: "John",
				last_name: "Doe",
				email: "john@example.com",
				user_id: "12345",
				address: {
					address_line_1: "123 Main St",
					city: "Anytown",
					state: "CA",
					zipcode: "12345",
					country: "USA",
				},
			},
			{
				first_name: "Jane",
				last_name: "Doe",
				email: "jane@example.com",
				user_id: "12345",
				address: {
					address_line_1: "456 Main St",
					city: "Anytown",
					state: "CA",
					zipcode: "12345",
					country: "USA",
				},
			},
		];
		const insertedIds = ["12345", "67890"];
		(db.collection(collectionName).insertMany as jest.Mock).mockResolvedValueOnce({
			insertedIds,
		});

		const result = await contactRepository.create(contacts);
		expect(result).toEqual(insertedIds);
	});

	it("should find all contacts", async () => {
		const contacts: WithId<Contact>[] = [
			{
				_id: new ObjectId("67cf5673562cd26f0c2ffe48"),
				first_name: "John",
				last_name: "Doe",
				email: "john@example.com",
				user_id: "12345",
				address: { address_line_1: "123 Main St", city: "Anytown", state: "CA", zipcode: "12345", country: "USA" },
			},
			{
				_id: new ObjectId("67cf5673562cd26f0c2ffe49"),
				first_name: "Jane",
				last_name: "Doe",
				email: "jane@example.com",
				user_id: "12345",
				address: { address_line_1: "456 Main St", city: "Anytown", state: "CA", zipcode: "12345", country: "USA" },
			},
		];
		(db.collection(collectionName).find as jest.Mock).mockReturnValue({
			skip: jest.fn().mockReturnValue({
				limit: jest.fn().mockReturnValue({
					toArray: jest.fn().mockResolvedValue(contacts),
				}),
			}),
		});

		const result = await contactRepository.findAll();
		expect(result).toEqual(contacts.map((contact) => ({ ...contact, id: contact._id.toString() })));
	});

	it("should find one contact", async () => {
		const contact: WithId<Contact> = {
			_id: new ObjectId("67cf5673562cd26f0c2ffe48"),
			first_name: "John",
			last_name: "Doe",
			email: "john@example.com",
			user_id: "12345",
			address: { address_line_1: "123 Main St", city: "Anytown", state: "CA", zipcode: "12345", country: "USA" },
		};
		(db.collection(collectionName).findOne as jest.Mock).mockResolvedValueOnce(contact);

		const result = await contactRepository.findOne({ email: "john@example.com" });
		expect(result).toEqual({ ...contact, id: contact._id.toString() });
	});

	it("should not find a contact", async () => {
		const result = await contactRepository.findOne({ email: "john.doe@example.com" });
		expect(result).toBeNull();
	});

	it("should update a contact", async () => {
		const query = { email: "john.doe@example.com" };
		const data = {
			address: { address_line_1: "123 Main St", city: "Anytown", state: "CA", zipcode: "12345", country: "USA" },
		};
		(db.collection(collectionName).updateOne as jest.Mock).mockResolvedValueOnce({
			modifiedCount: 1,
		});

		const result = await contactRepository.update(query, data);
		expect(result).toEqual({ modifiedCount: 1 });
	});

	it("should delete a contact", async () => {
		const query = { email: "john.doe@example.com" };
		(db.collection(collectionName).deleteOne as jest.Mock).mockResolvedValueOnce({
			deletedCount: 1,
		});

		const result = await contactRepository.delete(query);
		expect(result).toEqual({ deletedCount: 1 });
	});
});
