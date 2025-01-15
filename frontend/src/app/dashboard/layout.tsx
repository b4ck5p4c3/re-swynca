"use client";

import React from "react";
import {Menu, MenuEntry} from "@/components/menu";
import {SelfUserBlock} from "@/components/self-user-block";
import logo from "@/static/images/logo.svg"
import Image from "next/image";
import {useRouter} from "next/navigation";

export default function DashboardLayout({children,}: Readonly<{ children: React.ReactNode; }>) {
    const router = useRouter();

    return (
        <div className={"w-full"}>
            <div className={"w-9/12 m-auto flex flex-col gap-8 mb-10"}>
                <div className={"border-b-2 border-b-gray-300"}>
                    <div className={"flex flex-row pt-5 pb-5 items-center gap-4 justify-center"}>
                        <div className={"text-4xl font-bold flex-row items-center gap-4 flex-1 hidden xs:flex cursor-pointer"} onClick={() => router.push("/")}>
                            <Image src={logo} alt={"logo"} width={40} className={"min-w-[40px]"}/>
                            <span className={"hidden 2xl:inline"}>RE: Swynca</span>
                        </div>
                        <div className={"hidden lg:block"}>
                            <Menu>
                                <MenuEntry url={"/dashboard"}>Dashboard</MenuEntry>
                                <MenuEntry url={"/dashboard/transactions"}
                                           matches={["/dashboard/transactions/member", "/dashboard/transactions/space"]}>Transactions</MenuEntry>
                                <MenuEntry url={"/dashboard/members"}>Members</MenuEntry>
                                <MenuEntry url={"/dashboard/memberships"}>Memberships</MenuEntry>
                            </Menu>
                        </div>
                        <div className={"flex-2"}>
                            <SelfUserBlock/>
                        </div>
                    </div>
                    <div className={"block lg:hidden mb-4"}>
                        <Menu>
                            <MenuEntry url={"/dashboard"}>Dashboard</MenuEntry>
                            <MenuEntry url={"/dashboard/transactions"}
                                       matches={["/dashboard/transactions/member", "/dashboard/transactions/space"]}>Transactions</MenuEntry>
                            <MenuEntry url={"/dashboard/members"}>Members</MenuEntry>
                            <MenuEntry url={"/dashboard/memberships"}>Memberships</MenuEntry>
                        </Menu>
                    </div>
                </div>
                {children}
            </div>
        </div>
    );
}