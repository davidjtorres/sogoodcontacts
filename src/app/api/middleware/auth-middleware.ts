import { NextRequest, NextResponse } from "next/server";
import { UserRepository } from "@/app/api/repositories/user-repository";
import { createBaseContainer } from "@/app/api/inversify.config";
import { User } from "@/app/api/models/user";

/**
 * Authentication middleware that simulates a logged-in user
 * @returns The authenticated user or null if authentication fails
 */
export async function authenticateUser(): Promise<User | null> {
	try {
		// Create a container and get the UserRepository
		const container = await createBaseContainer();
		const userRepository = container.get<UserRepository>(UserRepository);

		// Hardcoded user ID - assuming this user exists in the database for testing purposes
		const authUserId = process.env.AUTH_USER_ID;

		if (!authUserId) {
			throw new Error("AUTH_USER_ID is not set");
		}

		// Fetch the user by ID
		const user = await userRepository.findById(authUserId);

		if (!user) {
			console.error("Failed to authenticate: User not found with ID:", authUserId);
			return null;
		}

		return user;
	} catch (error) {
		console.error("Authentication error:", error);
		return null;
	}
}

/**
 * Middleware to protect API routes
 * @param handler The API route handler
 * @returns A wrapped handler that includes authentication
 */
export function withAuth<T>(handler: (req: NextRequest, user: User) => Promise<T>) {
	return async (request: NextRequest): Promise<T | NextResponse> => {
		const user = await authenticateUser();

		if (!user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		return handler(request, user);
	};
}
