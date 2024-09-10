"use client";

import {useParams} from "next/navigation";
import {useQuery} from "@tanstack/react-query";
import {getClient, R} from "@/lib/api/client";
import {MEMBER_ACS_KEYS_QUERY_KEY, MEMBER_QUERY_KEY} from "@/lib/cache-tags";
import React from "react";
import {Skeleton} from "@/components/ui/skeleton";
import {Separator} from "@/components/ui/separator";
import {Button} from "@/components/ui/button";
import {Pencil1Icon, PlusIcon, TrashIcon} from "@radix-ui/react-icons";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";

export function MemberInfoRow({title, children}: { title: string, children: React.ReactNode }) {
    return <div className={"flex flex-row"}>
        <div className={"font-semibold"}>{title}:</div>
        <div className={"flex-1"}></div>
        <div>{children}</div>
    </div>;
}

function TelegramMetadata({metadata}: { metadata?: { telegramId: string; telegramName: string } }) {
    return metadata ? <div className={"flex flex-row gap-2"}>
        <a href={`tg://user?id=${metadata.telegramId}`} className={"underline leading-8"}>
            {metadata.telegramName} ({metadata.telegramId})
        </a>
        <Button className={"w-8 p-0 h-8"}><Pencil1Icon/></Button>
        <Button variant={"destructive"} className={"w-8 p-0 h-8"}><TrashIcon/></Button>
    </div> : <div className={"flex flex-row gap-2"}>
        <span className={"leading-8"}>Not linked</span>
        <Button className={"w-8 p-0 h-8"}><PlusIcon/></Button>
    </div>
}

function GitHubMetadata({metadata}: { metadata?: { githubId: string; githubUsername: string } }) {
    return metadata ? <div className={"flex flex-row gap-2"}>
        <a href={`https://github.com/${metadata.githubUsername}`} className={"underline leading-8"}>
            {metadata.githubUsername} ({metadata.githubId})
        </a>
        <Button className={"w-8 p-0 h-8"}><Pencil1Icon/></Button>
        <Button variant={"destructive"} className={"w-8 p-0 h-8"}><TrashIcon/></Button>
    </div> : <div className={"flex flex-row gap-2"}>
        <span className={"leading-8"}>Not linked</span>
        <Button className={"w-8 p-0 h-8"}><PlusIcon/></Button>
    </div>
}

export default function MemberPage() {
    const client = getClient();

    const {id} = useParams<{ id: string }>();

    const member = useQuery({
        queryFn: async () => {
            const memberData = R(await client.GET("/api/members/{id}", {
                params: {
                    path: {
                        id
                    }
                }
            }));
            return memberData.data!;
        },
        queryKey: [`${MEMBER_QUERY_KEY}-${id}`],
        retry: false,
    });

    const memberAcsKeys = useQuery({
        queryFn: async () => {
            const memberAcsKeysData = R(await client.GET("/api/acs-keys/member/{memberId}", {
                params: {
                    path: {
                        memberId: id
                    }
                }
            }));

            return memberAcsKeysData.data!;
        },
        queryKey: [`${MEMBER_ACS_KEYS_QUERY_KEY}-${id}`],
        retry: false
    });

    return <div>
        <div className={"flex flex-col gap-4"}>
            <MemberInfoRow title={"Name"}>{member.data ? member.data.name :
                <Skeleton className={"h-[24px] w-[100px]"}/>}</MemberInfoRow>
            <MemberInfoRow title={"E-Mail"}>{member.data ? member.data.email :
                <Skeleton className={"h-[24px] w-[200px]"}/>}</MemberInfoRow>
            <MemberInfoRow title={"Joined at"}>{member.data ? new Date(member.data.joinedAt).toLocaleDateString() :
                <Skeleton className={"h-[24px] w-[90px]"}/>}</MemberInfoRow>
            <MemberInfoRow title={"Balance"}>{member.data ? member.data.balance :
                <Skeleton className={"h-[24px] w-[50px]"}/>}</MemberInfoRow>
            <MemberInfoRow title={"Status"}>{member.data ? member.data.status === "active" ? "Active" : "Frozen" :
                <Skeleton className={"h-[24px] w-[60px]"}/>}</MemberInfoRow>
            <Separator/>
            <MemberInfoRow title={"Telegram"}>{member.data ?
                <TelegramMetadata metadata={member.data.telegramMetadata}/> :
                <Skeleton className={"h-[32px] w-[120px]"}/>}</MemberInfoRow>
            <MemberInfoRow title={"GitHub"}>{member.data ?
                <GitHubMetadata metadata={member.data.githubMetadata}/> :
                <Skeleton className={"h-[32px] w-[80px]"}/>}</MemberInfoRow>
            <Separator/>
            <div className={"text-2xl font-semibold"}>Subscriptions:</div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Subscription</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Subscribed at</TableHead>
                        <TableHead>Declined at</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>

                </TableBody>
            </Table>
            <Separator/>
            <div className={"text-2xl font-semibold"}>ACS keys:</div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Key</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {memberAcsKeys.data ? memberAcsKeys.data.map(acsKey =>
                        <TableRow>
                            <TableCell>{acsKey.name}</TableCell>
                            <TableCell>{acsKey.type}</TableCell>
                            <TableCell>{acsKey.key}</TableCell>
                        </TableRow>)}
                </TableBody>
            </Table>
        </div>
    </div>;
}