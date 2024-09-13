import {type ClassValue, clsx} from "clsx"
import {twMerge} from "tailwind-merge"
import {MemberTransactionDTO} from "@/lib/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getMemberTransactionTypeText(transaction: MemberTransactionDTO): string {
    switch (transaction.type) {
        case "deposit":
            switch (transaction.source) {
                case "magic":
                    return "Magic deposit";
                case "topup":
                    return "Balance topup";
                case "donate":
                    return "Donate";
                default:
                    return `Deposit ${transaction.source}`;
            }
        case "withdrawal":
            switch (transaction.target) {
                case "magic":
                    return "Magic withdrawal";
                case "membership":
                    return "Membership";
                default:
                    return `Withdrawal ${transaction.source}`;
            }
    }
}