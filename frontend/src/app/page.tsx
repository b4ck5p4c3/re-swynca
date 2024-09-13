"use client"

import {Loader2} from "lucide-react";
import {useQuery} from "@tanstack/react-query";
import {getClient, R} from "@/lib/api/client";
import {useEffect} from "react";
import {redirect, useRouter} from "next/navigation";
import {AUTH_SELF_QUERY_KEY} from "@/lib/cache-tags";
import {setCurrentMemberId} from "@/lib/auth-storage";

export default function HomePage() {
    const client = getClient();

    const router = useRouter();

    const selfMemberId = useQuery({
        queryFn: async () => {
            const response = R(await client.GET("/api/auth/self", {}));
            return response.data!.id;
        },
        retry: false,
        queryKey: [AUTH_SELF_QUERY_KEY]
    });

    useEffect(() => {
        if (selfMemberId.data) {
            setCurrentMemberId(selfMemberId.data);
            router.replace("/dashboard");
        }
    }, [selfMemberId]);

    return (<div className={"w-screen h-screen flex items-center justify-center"}>
        <Loader2 className={"animate-spin h-16 w-16"}></Loader2>
    </div>);
}
