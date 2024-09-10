import createClient, {Client} from "openapi-fetch";
import type {paths} from "./types";

export function getClient(): Client<paths> {
    return createClient<paths>({
        baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
        credentials: "include"
    })
}

export class UnauthorizedError extends Error {
    constructor() {
        super("Unauthorized");
    }
}

interface ResponseWithError<T> {
    error?: {
        statusCode: number;
        message: string;
    };
    data?: T;
}

export function R<T extends ResponseWithError<TData>, TData>(response: T): T {
    if (response.error) {
        const error = response.error;
        if (error.statusCode === 401) {
            throw new UnauthorizedError();
        }
        throw new Error(`${error.statusCode} ${error.message}`);
    }

    if (!response.data) {
        throw new Error("No response");
    }

    return response;
}