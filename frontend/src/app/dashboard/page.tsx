"use client";

import Image from "next/image";
import type {ReactNode} from "react";
import youMember from "@/static/images/you_member.svg";
import info from "@/static/images/info.svg";
import {Card, CardContent, CardHeader} from "@/components/ui/card";
import {useQuery} from "@tanstack/react-query";
import {getClient, R} from "@/lib/api/client";
import {
    MEMBER_SUBSCRIPTIONS_STATS_QUERY_KEY,
    MEMBERS_STATS_QUERY_KEY,
    SPACE_BALANCE_QUERY_KEY
} from "@/lib/cache-tags";
import {Skeleton} from "@/components/ui/skeleton";
import {moneyToDecimal} from "@/lib/money";
import {Money} from "@/components/money";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";

function CardHeaderWithTooltip({children, tooltip}: { children: ReactNode; tooltip: ReactNode }) {
    return <CardHeader>
        <div className={"flex items-center gap-3"}>
            {children}
            <Popover>
                <div className={"group relative flex"}>
                    <PopoverTrigger asChild>
                        <button
                            type={"button"}
                            aria-label={"Show info"}
                            className={"flex size-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"}
                        >
                            <Image src={info} alt={""} className={"size-5"}/>
                        </button>
                    </PopoverTrigger>
                    <div
                        className={"pointer-events-none absolute left-1/2 top-full z-50 mt-2 hidden w-max -translate-x-1/2 rounded-md border bg-popover px-3 py-2 text-sm font-normal text-popover-foreground opacity-0 shadow-md transition-opacity group-hover:opacity-100 md:block"}
                    >
                        {tooltip}
                    </div>
                </div>
                <PopoverContent className={"w-max px-3 py-2 text-sm md:hidden"} side={"bottom"} align={"center"}>
                    {tooltip}
                </PopoverContent>
            </Popover>
        </div>
    </CardHeader>;
}

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

    const isInDebt = spaceBalance.data && +spaceBalance.data.balance < +(process.env.NEXT_PUBLIC_REQUIRED_PAYMENT ?? 0);

    return <div className={"flex flex-col gap-10"}>
        <div className={"flex flex-row gap-6 items-center justify-center"}>
            <div className={"sm:text-7xl xs:text-6xl text-4xl font-semibold"}>You member</div>
            <Image src={youMember} alt={"you member"} className={"w-[80px]"}/>
        </div>
        <div className={"grid md:grid-cols-2 xl:grid-cols-3 gap-10"}>
            <Card>
                <CardHeader>
                    <div className={"xs:text-4xl text-3xl font-semibold"}>Balance:</div>
                </CardHeader>
                <CardContent>
                    {spaceBalance.data ? <div className={"xs:text-5xl text-4xl"}><Money
                            amount={spaceBalance.data.balance}/></div> :
                        <Skeleton className={"h-[3rem] w-[200px]"}/>}
                </CardContent>
            </Card>
            <Card>
                <CardHeaderWithTooltip tooltip={"How much we have to pay monthly"}>
                    <div className={"xs:text-4xl text-3xl font-semibold"}>Payment:</div>
                </CardHeaderWithTooltip>
                <CardContent>
                    <div className={"xs:text-5xl text-4xl"}><Money
                        amount={process.env.NEXT_PUBLIC_REQUIRED_PAYMENT ?? "0"}/></div>
                </CardContent>
            </Card>
            <Card>
                <CardHeaderWithTooltip tooltip={
                    isInDebt
                        ? "How much we need to get for the payment"
                        : "How much we have left after the payment"}>
                    <div className={"xs:text-4xl text-3xl font-semibold"}>
                        {isInDebt ? "Required:" : "Leftover:"}
                    </div>
                </CardHeaderWithTooltip>
                <CardContent>
                    {spaceBalance.data ?
                        <div className={"xs:text-5xl text-4xl"}><Money amount={moneyToDecimal(spaceBalance.data.balance).minus(
                            moneyToDecimal(process.env.NEXT_PUBLIC_REQUIRED_PAYMENT ?? "0"))}/></div> :
                        <Skeleton className={"h-[3rem] w-[200px]"}/>}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <div className={"xs:text-4xl text-3xl font-semibold"}>Members:</div>
                </CardHeader>
                <CardContent>
                    {memberStats.data ? <div className={"xs:text-5xl text-4xl"}>
                            {memberStats.data.count}
                        </div> :
                        <Skeleton className={"h-[3rem] w-[50px]"}/>}
                </CardContent>
            </Card>
            <Card>
                <CardHeaderWithTooltip tooltip={"The total amount of money we get from all active subscriptions"}>
                    <div className={"xs:text-4xl text-3xl font-semibold"}>Monthly target:</div>
                </CardHeaderWithTooltip>
                <CardContent>
                    {membershipSubscriptionStats.data ? <div className={"xs:text-5xl text-4xl"}><Money
                            amount={membershipSubscriptionStats.data.totalActiveAmount}/></div> :
                        <Skeleton className={"h-[3rem] w-[200px]"}/>}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <div className={"xs:text-4xl text-3xl font-semibold"}>More stats coming soon</div>
                </CardHeader>
                <CardContent>
                </CardContent>
            </Card>
        </div>
    </div>;
}