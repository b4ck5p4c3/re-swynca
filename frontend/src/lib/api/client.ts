import createClient, {Client} from "openapi-fetch";
import type {paths} from "./types";

export function getClient(): Client<paths> {
    return createClient<paths>({
        baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
        credentials: "include"
    })
}

export class UnauthorizedError extends Error {
    constructor(text: string) {
        super(text);
    }
}

interface ResponseWithError<T> {
    error?: {
        statusCode: number;
        message: string;
    };
    data?: T;
}

const errorDescriptions: Record<string, string> = {
    "actor-member-not-found": "Actor not found",
    "actor-frozen": "Actor frozen",
    "subject-member-not-found": "Subject not found",
    "member-not-found": "Member not found",
    "not-authorized": "Not authorized",
    "space-member-not-found": "Space member not found (500)",
    "acs-key-already-exists": "ACS key already exists in other member",
    "member-email-already-exists": "Member with this email already exists",
    "member-no-logto-binding": "Member has no Logto binding",
    "membership-not-found": "Membership not found",
    "membership-frozen": "Membership is frozen",
    "member-already-subscribed": "Member already subscribed to this membership",
    "membership-subscription-not-found": "Membership subscription not found",
    "membership-subscription-already-declined": "Membership subscription already declined",
    "member-no-telegram-metadata": "Member has no Telegram",
    "member-no-github-metadata": "Member has no GitHub",
    "member-github-already-exists": "This GitHub already linked to other member",
    "member-telegram-already-exists": "This Telegram already linked to other member",
    "invalid-github-username": "Invalid GitHub username",
    "space-balance-is-too-low": "Space balance is lower that the transaction amount"
};

function getErrorText(error: {statusCode: number, message: string}): string {
    return errorDescriptions[error.message] ? errorDescriptions[error.message] :
        `${error.statusCode} ${error.message}`;
}

export function R<T extends ResponseWithError<TData>, TData>(response: T): T {
    if (response.error) {
        const error = response.error;
        if (error.statusCode === 401) {
            throw new UnauthorizedError(getErrorText(error));
        }
        throw new Error(getErrorText(error));
    }

    if (!response.data) {
        throw new Error("No response");
    }

    return response;
}