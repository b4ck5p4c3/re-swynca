import type {Metadata} from "next";
import React from "react";
import {Toaster} from "@/components/ui/toaster";
import {AppQueryClientProvider} from "@/components/app-query-client-provider";
import {Avatar, AvatarFallback} from "@/components/ui/avatar";
import {Button} from "@/components/ui/button";
import {Menu, MenuEntry} from "@/components/menu";
import {SelfUserBlock} from "@/components/self-user-block";

export const metadata: Metadata = {
    title: "RE: Swynca",
    description: "B4CKSP4CE member/money management system",
};

export default function DashboardLayout({children,}: Readonly<{ children: React.ReactNode; }>) {

    return (
        <div className={"w-full"}>
            <div className={"w-9/12 m-auto flex flex-col gap-8"}>
                <div className={"flex flex-row pt-5 pb-5 items-center border-b-2 border-b-gray-300 gap-20"}>
                    <div className={"text-4xl font-bold"}>RE: Swynca</div>
                    <div className={"flex-1"}/>
                    <Menu>
                        <MenuEntry url={"/dashboard"}>Dashboard</MenuEntry>
                        <MenuEntry url={"/dashboard/transactions"}>Transactions</MenuEntry>
                        <MenuEntry url={"/dashboard/members"}>Members</MenuEntry>
                        <MenuEntry url={"/dashboard/memberships"}>Memberships</MenuEntry>
                        <MenuEntry url={"/dashboard/audit-log"}>Audit Log</MenuEntry>
                    </Menu>
                    <SelfUserBlock/>
                </div>
                {children}
            </div>
        </div>
    );
}