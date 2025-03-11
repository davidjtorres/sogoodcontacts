/* eslint-disable @typescript-eslint/no-explicit-any */
interface updateResult {
	modifiedCount: number;
}

interface deleteResult {
	deletedCount: number;
}

export interface IRepository<T> {
	create(data: T | T[]): Promise<string | number | string[] | number[]>;
	findAll(query?: Record<string, any>): Promise<T[]>;
	findOne(query: Record<string, any>): Promise<T | null>;
	update(query: Record<string, any>, data: Partial<T>): Promise<updateResult>;
	delete(query: Record<string, any>): Promise<deleteResult>;
}
