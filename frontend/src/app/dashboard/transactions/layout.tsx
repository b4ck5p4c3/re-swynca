"use client";

import React from "react";
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {usePathname, useRouter} from "next/navigation";

export default function TransactionsLayout({children,}: Readonly<{ children: React.ReactNode; }>) {
    const router = useRouter();
    const pathname = usePathname();

    return (
        <div className={"flex flex-col gap-2"}>
            <Tabs value={pathname} onValueChange={(value) => {
                router.push(value);
            }}>
                <TabsList className={"grid w-full grid-cols-2"}>
                    <TabsTrigger value={"/dashboard/transactions/member"}>Member&nbsp;<span className={"sm:inline hidden"}>transactions</span></TabsTrigger>
                    <TabsTrigger value={"/dashboard/transactions/space"}>Space&nbsp;<span className={"sm:inline hidden"}>transactions</span></TabsTrigger>
                </TabsList>
            </Tabs>
            <div>{children}</div>
        </div>
    );
}