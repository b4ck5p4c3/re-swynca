"use client";

import {getClient, R} from "@/lib/api/client";
import {useQuery} from "@tanstack/react-query";
import {MEMBERS_QUERY_KEY} from "@/lib/cache-tags";
import {GitHubLink} from "@/components/github-link";
import {TelegramLink} from "@/components/telegram-link";
import {Badge} from "@/components/ui/badge";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {useState} from "react";
import {CreateMemberDialog} from "@/components/dialogs/create-member";
import {Money} from "@/components/money";

export default function MembersPage() {
    const client = getClient();

    const [createMemberDialogOpened, setCreateMemberDialogOpened] = useState(false);

    const members = useQuery({
        queryFn: async () => {
            const response = R(await client.GET("/api/members", {}));
            return response.data!;
        },
        retry: false,
        queryKey: [MEMBERS_QUERY_KEY]
    });

    const router = useRouter();

    return <div className={"flex flex-col gap-6"}>
        <div className={"flex flex-row"}>
            <div className={"text-3xl font-semibold"}>Members</div>
            <div className={"flex-1"}/>
            <Button onClick={() => setCreateMemberDialogOpened(true)}>Create</Button>
        </div>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>E-Mail</TableHead>
                    <TableHead>Joined at</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead></TableHead>
                    <TableHead></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {members.data ? members.data.map(member => <TableRow key={member.id} className={"cursor-pointer"}
                                                                     onClick={() => router.push(`/dashboard/members/${member.id}`)}>
                    <TableCell>{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{new Date(member.joinedAt).toLocaleDateString()}</TableCell>
                    <TableCell><Money amount={member.balance}/></TableCell>
                    <TableCell className={"flex flex-row gap-2 justify-end"}>
                        {member.githubMetadata ? <GitHubLink username={member.githubMetadata.githubUsername}/> : <></>}
                        {member.telegramMetadata ? <TelegramLink id={member.telegramMetadata.telegramId}/> : <></>}
                    </TableCell>
                    <TableCell>
                        <Badge className={"w-full justify-center"}
                               variant={member.status === "active" ? "default" : "destructive"}>
                            {member.status === "active" ? "Active" : "Frozen"}
                        </Badge>
                    </TableCell>
                </TableRow>) : <></>}
            </TableBody>
        </Table>
        <CreateMemberDialog onClose={() => setCreateMemberDialogOpened(false)} open={createMemberDialogOpened}/>
    </div>;
}