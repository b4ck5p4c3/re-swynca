import React from "react";
import {Menu, MenuEntry} from "@/components/menu";
import {SelfUserBlock} from "@/components/self-user-block";
import logo from "@/static/images/logo.svg"
import Image from "next/image";

export default function DashboardLayout({children,}: Readonly<{ children: React.ReactNode; }>) {

    return (
        <div className={"w-full"}>
            <div className={"w-9/12 m-auto flex flex-col gap-8"}>
                <div className={"flex flex-row pt-5 pb-5 items-center border-b-2 border-b-gray-300 gap-20"}>
                    <div className={"text-4xl font-bold flex flex-row items-center gap-4"}><Image src={logo}
                                                                                                  alt={"logo"}
                                                                                                  width={40}/> RE:
                        Swynca
                    </div>
                    <div className={"flex-1"}/>
                    <Menu>
                        <MenuEntry url={"/dashboard"}>Dashboard</MenuEntry>
                        <MenuEntry url={"/dashboard/transactions"}
                                   matches={["/dashboard/transactions/member", "/dashboard/transactions/space"]}>Transactions</MenuEntry>
                        <MenuEntry url={"/dashboard/members"}>Members</MenuEntry>
                        <MenuEntry url={"/dashboard/memberships"}>Memberships</MenuEntry>
                    </Menu>
                    <SelfUserBlock/>
                </div>
                {children}
            </div>
        </div>
    );
}