"use client";

import {getClient, R} from "@/lib/api/client";
import {useQuery} from "@tanstack/react-query";
import {MEMBERSHIPS_QUERY_KEY} from "@/lib/cache-tags";
import {Button} from "@/components/ui/button";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {Badge} from "@/components/ui/badge";
import {MembershipDTO} from "@/lib/types";
import React, {useState} from "react";
import {CreateMembershipDialog} from "@/components/dialogs/create-membership";
import {UpdateMembershipDialog} from "@/components/dialogs/update-membership";
import { Money } from "@/components/money";

export default function MembershipsPage() {
    const [createMembershipDialogOpened, setCreateMembershipDialogOpened] = useState(false);
    const [updateMembershipDialogOpened, setUpdateMembershipDialogOpened] = useState(false);
    const [currentUpdatingMembership, setCurrentUpdatingMembership] = useState<MembershipDTO | null>(null);

    const client = getClient();

    const memberships = useQuery({
        queryFn: async () => {
            const response = R(await client.GET("/api/memberships", {}));
            return response.data!;
        },
        retry: false,
        queryKey: [MEMBERSHIPS_QUERY_KEY]
    });

    return <div className={"flex flex-col gap-6"}>
        <div className={"flex flex-row"}>
            <div className={"text-3xl font-semibold"}>Memberships</div>
            <div className={"flex-1"}/>
            <Button onClick={() => setCreateMembershipDialogOpened(true)}>Create</Button>
        </div>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {memberships.data ? memberships.data.map(membership =>
                    <TableRow className={"cursor-pointer"} onClick={() => {
                        setCurrentUpdatingMembership(membership);
                        setUpdateMembershipDialogOpened(true);
                    }} key={membership.id}>
                        <TableCell>{membership.title}</TableCell>
                        <TableCell><Money amount={membership.amount}/></TableCell>
                        <TableCell>
                            <Badge className={"w-full justify-center"}
                                   variant={membership.active ? "default" : "destructive"}>
                                {membership.active ? "Active" : "Disabled"}
                            </Badge>
                        </TableCell>
                    </TableRow>) : <></>}
            </TableBody>
        </Table>
        <CreateMembershipDialog open={createMembershipDialogOpened}
                                onClose={() => setCreateMembershipDialogOpened(false)}/>
        {currentUpdatingMembership ?
            <UpdateMembershipDialog open={updateMembershipDialogOpened}
                                    onClose={() => setUpdateMembershipDialogOpened(false)}
                                    current={currentUpdatingMembership}/>
            : <></>}
    </div>;
}