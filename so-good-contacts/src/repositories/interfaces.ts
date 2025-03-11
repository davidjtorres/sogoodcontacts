/* eslint-disable @typescript-eslint/no-explicit-any */
export interface IRepository<T> {
    create(data: T): Promise<T>;
    findAll(query?: Record<string, any>): Promise<T[]>;
    findOne(query: Record<string, any>): Promise<T | null>;
    update(query: Record<string, any>, data: Partial<T>): Promise<number>;
    delete(query: Record<string, any>): Promise<number>;
  }
  