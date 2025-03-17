import "reflect-metadata";
import { Container } from "inversify";
import { Db } from "mongodb";
import { connectMongoDB } from "@/app/api/database/mongo-db-driver";
import { ContactRepository } from "@/app/api/repositories/contact-repository";
import { UserRepository } from "@/app/api/repositories/user-repository";
import { ConstantContactApi } from "@/app/api/constant-contact-gateway/constant-contact-api";
import { ConstantContactApiAdapter } from "@/app/api/constant-contact-gateway/constant-contact-api-adapter";
import axios from "axios";
import { User } from "./models/user";
import { ContactsService } from "./services/contacts-service";

// Create a container without user context for auth middleware
export const createBaseContainer = async () => {
	const container = new Container();

	const dbInstance = await connectMongoDB();
	container.bind<Db>("Database").toConstantValue(dbInstance);

	container.bind<UserRepository>(UserRepository).toSelf();

	return container;
};

export const getContainer = async (user: User) => {
	const container = new Container();

	const dbInstance = await connectMongoDB();
	container.bind<Db>("Database").toConstantValue(dbInstance);

	container.bind<ContactRepository>(ContactRepository).toSelf();
	container.bind<UserRepository>(UserRepository).toSelf();

	container.bind<ConstantContactApi>(ConstantContactApi).toDynamicValue(() => {
		const axiosInstance = axios.create({
			baseURL: process.env.CONSTANT_CONTACT_API_URL,
		});
		return new ConstantContactApi(axiosInstance, user.constant_contact_token || "");
	});
	container.bind<ConstantContactApiAdapter>(ConstantContactApiAdapter).toSelf();
	container.bind<ContactsService>(ContactsService).toSelf();

	return container;
};
