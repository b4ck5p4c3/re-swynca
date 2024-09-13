"use client";

import Image from "next/image";
import youMember from "@/static/images/you_member.svg";
import {Card, CardContent, CardHeader} from "@/components/ui/card";

export default function DashboardPage() {


    return <div className={"flex flex-col gap-10"}>
        <div className={"flex flex-row gap-6 items-center justify-center"}>
            <div className={"text-7xl font-semibold"}>You member</div>
            <Image src={youMember} alt={"you member"} className={"w-[80px]"}/>
        </div>
        <div className={"flex flex-row gap-6"}>
            <Card className={"flex-1"}>
                <CardHeader>
                    <div className={"text-4xl font-semibold"}>Balance:</div>
                </CardHeader>
                <CardContent>
                </CardContent>
            </Card>
            <Card className={"flex-1"}>
                <CardHeader>
                    <div className={"text-4xl font-semibold"}>Payment:</div>
                </CardHeader>
                <CardContent>
                </CardContent>
            </Card>
            <Card className={"flex-1"}>
                <CardHeader>
                    <div className={"text-4xl font-semibold"}>Required:</div>
                </CardHeader>
                <CardContent>
                </CardContent>
            </Card>
        </div>
    </div>;
}