import { Container } from "inversify";
import { Db } from "mongodb";
import { UserRepository } from "./user-repository";
import { before } from "node:test";
import { ObjectId } from "mongodb";
describe("UserRepository", () => {
	let container: Container;
	let db: Db;

	before(() => {
		container = new Container();
		container.bind<UserRepository>(UserRepository).toSelf();
		db = {
			collection: jest.fn().mockReturnValue({
				insertOne: jest.fn().mockReturnValue({
					insertedId: "1",
				}),
				find: jest.fn(),
				findOne: jest.fn(),

				updateOne: jest.fn().mockReturnValue({
					modifiedCount: 1,
				}),
				deleteOne: jest.fn().mockReturnValue({
					deletedCount: 1,
				}),
			}),
		} as unknown as Db;
		container.bind<Db>("Database").toConstantValue(db);
	});

	it("should create a user", () => {
		const userRepository = container.get<UserRepository>(UserRepository);
		userRepository.create({ name: "John Doe", email: "john.doe@example.com" });
		expect(db.collection("users").insertOne).toHaveBeenCalledWith({ name: "John Doe", email: "john.doe@example.com" });
	});

	it("should find a user by email", () => {
		const userRepository = container.get<UserRepository>(UserRepository);
		userRepository.findByEmail("john.doe@example.com");
		expect(db.collection("users").findOne).toHaveBeenCalledWith({ email: "john.doe@example.com" });
	});

	it("should find a user by id", () => {
		const userRepository = container.get<UserRepository>(UserRepository);
		userRepository.findById("67cf575d562cd26f0c2ffe49");
		expect(db.collection("users").findOne).toHaveBeenCalledWith({ _id: new ObjectId("67cf575d562cd26f0c2ffe49") });
	});

	it("should update a user", () => {
		const userRepository = container.get<UserRepository>(UserRepository);
		userRepository.update({ _id: new ObjectId("67cf575d562cd26f0c2ffe49") }, { name: "John Doe" });
		expect(db.collection("users").updateOne).toHaveBeenCalledWith(
			{ _id: new ObjectId("67cf575d562cd26f0c2ffe49") },
			{ $set: { name: "John Doe" } }
		);
	});

	it("should delete a user", () => {
		const userRepository = container.get<UserRepository>(UserRepository);
		userRepository.delete({ _id: new ObjectId("67cf575d562cd26f0c2ffe49") });
		expect(db.collection("users").deleteOne).toHaveBeenCalledWith({ _id: new ObjectId("67cf575d562cd26f0c2ffe49") });
	});

	it("should find all users", () => {
		const userRepository = container.get<UserRepository>(UserRepository);
		(db.collection("users").find as jest.Mock).mockReturnValue({
			toArray: jest.fn().mockReturnValue([
				{
					_id: new ObjectId("67cf575d562cd26f0c2ffe49"),
					name: "John Doe",
					email: "john.doe@example.com",
				},
			]),
		});
		userRepository.findAll();
		expect(db.collection("users").find).toHaveBeenCalled();
	});

	it("should find one user", () => {
		const userRepository = container.get<UserRepository>(UserRepository);
		(db.collection("users").findOne as jest.Mock).mockReturnValue({
			_id: new ObjectId("67cf575d562cd26f0c2ffe49"),
			name: "John Doe",
			email: "john.doe@example.com",
		});
		userRepository.findOne({ email: "john.doe@example.com" });
		expect(db.collection("users").findOne).toHaveBeenCalledWith({ email: "john.doe@example.com" });
	});
});
