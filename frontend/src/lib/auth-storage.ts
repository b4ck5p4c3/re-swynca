"use client";

import {UnauthorizedError} from "@/lib/api/client";

const CURRENT_MEMBER_ID_LOCAL_STORAGE_KEY = "current-member-id";

export function setCurrentMemberId(id: string): void {
    localStorage.setItem(CURRENT_MEMBER_ID_LOCAL_STORAGE_KEY, id);
}

export function getCurrentMemberId(): string {
     const memberId = localStorage.getItem(CURRENT_MEMBER_ID_LOCAL_STORAGE_KEY);
     if (!memberId) {
         throw new UnauthorizedError("Member ID not found in localstorage");
     }
     return memberId;
}