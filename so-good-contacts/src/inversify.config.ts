import "reflect-metadata";
import { Container } from "inversify";
import { Db } from "mongodb";
import { connectMongoDB } from "@/database/mongo-db-driver";
import { ContactRepository } from "@/repositories/contact-repository";

const container = new Container();

// Bind MongoDB instance
const dbInstance = await connectMongoDB();
container.bind<Db>("Database").toConstantValue(dbInstance);

// Bind repositories
container.bind<ContactRepository>(ContactRepository).toSelf();

export { container };
