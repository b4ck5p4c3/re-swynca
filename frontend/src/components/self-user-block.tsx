"use client";

import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import React from "react";
import {getClient, R} from "@/lib/api/client";
import {useQuery} from "@tanstack/react-query";
import {AUTH_SELF_QUERY_KEY, SELF_MEMBER_QUERY_KEY} from "@/lib/cache-tags";
import {getCurrentMemberId} from "@/lib/auth-storage";
import {Skeleton} from "@/components/ui/skeleton";
import {useRouter} from "next/navigation";

export function SelfUserBlock() {
    const client = getClient();

    const router = useRouter();

    const selfMember = useQuery({
        queryFn: async () => {
            const memberId = getCurrentMemberId();
            const response = R(await client.GET("/api/members/{id}", {
                params: {
                    path: {
                        id: memberId
                    }
                }
            }));

            return response.data!;
        },
        retry: false,
        queryKey: [SELF_MEMBER_QUERY_KEY]
    })

    return selfMember.data ? <div onClick={() => router.push(`/dashboard/members/${selfMember.data.id}`)}
                                  className={"flex flex-row items-center gap-2 cursor-pointer"}>
        <Avatar>
            <AvatarFallback>{selfMember.data.name.replace(/[a-zа-я0-9\s\-]/g, '')}</AvatarFallback>
        </Avatar>
        <div>{selfMember.data.name}</div>
    </div> : <div className={"flex flex-row items-center gap-2"}>
        <Skeleton className={"w-[40px] h-[40px] rounded-full"}/>
        <Skeleton className={"w-[100px] h-[24px]"}/>
    </div>;
}