"use client";

import Image from "next/image";
import youMember from "@/static/images/you_member.svg";
import {Card, CardContent, CardHeader} from "@/components/ui/card";
import {useQuery} from "@tanstack/react-query";
import {getClient, R} from "@/lib/api/client";
import {
    MEMBER_SUBSCRIPTIONS_QUERY_KEY,
    MEMBER_SUBSCRIPTIONS_STATS_QUERY_KEY,
    MEMBERS_STATS_QUERY_KEY,
    SPACE_BALANCE_QUERY_KEY
} from "@/lib/cache-tags";
import {Skeleton} from "@/components/ui/skeleton";
import {moneyToDecimal} from "@/lib/money";
import {Money} from "@/components/money";

export default function DashboardPage() {
    const client = getClient();

    const spaceBalance = useQuery({
        queryFn: async () => {
            const response = R(await client.GET("/api/space/balance", {}));
            return response.data!;
        },
        retry: false,
        queryKey: [SPACE_BALANCE_QUERY_KEY]
    });

    const memberStats = useQuery({
        queryFn: async () => {
            const response = R(await client.GET("/api/members/stats", {}));
            return response.data!;
        },
        retry: false,
        queryKey: [MEMBERS_STATS_QUERY_KEY]
    });

    const membershipSubscriptionStats = useQuery({
        queryFn: async () => {
            const response = R(await client.GET("/api/membership-subscriptions/stats", {}));
            return response.data!;
        },
        retry: false,
        queryKey: [MEMBER_SUBSCRIPTIONS_STATS_QUERY_KEY]
    })

    return <div className={"flex flex-col gap-10"}>
        <div className={"flex flex-row gap-6 items-center justify-center"}>
            <div className={"text-7xl font-semibold"}>You member</div>
            <Image src={youMember} alt={"you member"} className={"w-[80px]"}/>
        </div>
        <div className={"grid grid-cols-3 gap-10"}>
            <Card>
                <CardHeader>
                    <div className={"text-4xl font-semibold"}>Balance:</div>
                </CardHeader>
                <CardContent>
                    {spaceBalance.data ? <div className={"text-5xl"}><Money
                            amount={spaceBalance.data.balance}/></div> :
                        <Skeleton className={"h-[3rem] w-[200px]"}/>}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <div className={"text-4xl font-semibold"}>Payment:</div>
                </CardHeader>
                <CardContent>
                    <div className={"text-5xl"}><Money
                        amount={process.env.NEXT_PUBLIC_REQUIRED_PAYMENT ?? "0"}/></div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <div className={"text-4xl font-semibold"}>Required:</div>
                </CardHeader>
                <CardContent>
                    {spaceBalance.data ?
                        <div className={"text-5xl"}><Money amount={moneyToDecimal(spaceBalance.data.balance).minus(
                            moneyToDecimal(process.env.NEXT_PUBLIC_REQUIRED_PAYMENT ?? "0"))}/></div> :
                        <Skeleton className={"h-[3rem] w-[200px]"}/>}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <div className={"text-4xl font-semibold"}>Members:</div>
                </CardHeader>
                <CardContent>
                    {memberStats.data ? <div className={"text-5xl"}>
                            {memberStats.data.count}
                        </div> :
                        <Skeleton className={"h-[3rem] w-[50px]"}/>}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <div className={"text-4xl font-semibold"}>Monthly target:</div>
                </CardHeader>
                <CardContent>
                    {membershipSubscriptionStats.data ? <div className={"text-5xl"}><Money
                            amount={membershipSubscriptionStats.data.totalActiveAmount}/></div> :
                        <Skeleton className={"h-[3rem] w-[200px]"}/>}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <div className={"text-4xl font-semibold"}>More stats coming soon</div>
                </CardHeader>
                <CardContent>
                </CardContent>
            </Card>
        </div>
    </div>;
}