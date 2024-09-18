"use client";

import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import React, {useEffect, useState} from "react";
import {getClient, R} from "@/lib/api/client";
import {useQuery} from "@tanstack/react-query";
import {MEMBER_QUERY_KEY} from "@/lib/cache-tags";
import {getCurrentMemberId} from "@/lib/auth-storage";
import {Skeleton} from "@/components/ui/skeleton";
import {useRouter} from "next/navigation";
import {Money} from "@/components/money";

export function SelfUserBlock() {
    const client = getClient();

    const router = useRouter();

    const [currentMemberId, setCurrentMemberId] = useState("");
    useEffect(() => {
        setCurrentMemberId(getCurrentMemberId());
    }, []);

    const selfMember = useQuery({
        queryFn: async () => {
            const response = R(await client.GET("/api/members/{id}", {
                params: {
                    path: {
                        id: currentMemberId
                    }
                }
            }));

            return response.data!;
        },
        retry: false,
        queryKey: [MEMBER_QUERY_KEY, currentMemberId]
    })

    return selfMember.data ? <div onClick={() => router.push(`/dashboard/members/${selfMember.data.id}`)}
                                  className={"flex flex-row items-center gap-2 cursor-pointer"}>
        <Avatar>
            <AvatarFallback>{selfMember.data.name.replace(/[a-zа-я0-9\s\-]/g, '')}</AvatarFallback>
        </Avatar>
        <div>{selfMember.data.name}</div>
        <div className={"w-4"}/>
        <div><Money amount={selfMember.data.balance}/></div>
    </div> : <div className={"flex flex-row items-center gap-2"}>
        <Skeleton className={"w-[40px] h-[40px] rounded-full"}/>
        <Skeleton className={"w-[100px] h-[24px]"}/>
    </div>;
}