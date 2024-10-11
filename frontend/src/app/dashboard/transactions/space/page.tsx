"use client";

import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {useQuery} from "@tanstack/react-query";
import React, {useState} from "react";
import {getClient, R} from "@/lib/api/client";
import {SPACE_TRANSACTIONS_QUERY_KEY} from "@/lib/cache-tags";
import {Skeleton} from "@/components/ui/skeleton";
import {SpaceTransactionDTO} from "@/lib/types";
import {ArrowDownZA, ArrowUpAZ, Plus} from "lucide-react";
import {Paginator} from "@/components/paginator";
import {Button} from "@/components/ui/button";
import {CreateSpaceTransactionDialog} from "@/components/dialogs/create-space-transaction";
import {Money} from "@/components/money";
import {MemberLink} from "@/components/member-link";

const TRANSACTIONS_PER_PAGE = 20;

function EmptyTableRow() {
    return <TableRow>
        <TableCell>
            <Skeleton className={"w-[100px] h-[24px]"}/>
        </TableCell>
        <TableCell>
            <Skeleton className={"w-[60px] h-[24px]"}/>
        </TableCell>
        <TableCell>
            <Skeleton className={"w-[150px] h-[24px]"}/>
        </TableCell>
        <TableCell>
            <Skeleton className={"w-[70px] h-[24px]"}/>
        </TableCell>
        <TableCell>
            <Skeleton className={"w-[80px] h-[24px]"}/>
        </TableCell>
    </TableRow>;
}

function getTextTransactionType(transaction: SpaceTransactionDTO): string {
    switch (transaction.type) {
        case "deposit":
            switch (transaction.source) {
                case "magic":
                    return "Magic deposit";
                case "topup":
                    return "Balance topup";
                case "donate":
                    return "Donate";
                default:
                    return `Deposit ${transaction.source}`;
            }
        case "withdrawal":
            switch (transaction.target) {
                case "magic":
                    return "Magic withdrawal";
                case "basic":
                    return "Basic";
                case "purchases":
                    return "Purchases";
                default:
                    return `Withdrawal ${transaction.source}`;
            }
    }
}

export default function SpaceTransactionsPage() {
    const [offset, setOffset] = useState(0);
    const [sortBy, setSortBy] = useState<"date" | "createdAt">("date");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
    const [createSpaceTransactionDialogOpened, setCreateSpaceTransactionDialogOpened] = useState(false);

    const client = getClient();

    const spaceTransactions = useQuery({
        queryFn: async () => {
            const response = R(await client.GET("/api/space-transactions", {
                params: {
                    query: {
                        offset: offset.toString(),
                        count: TRANSACTIONS_PER_PAGE.toString(),
                        orderBy: sortBy,
                        orderDirection: sortDirection
                    }
                }
            }));
            return response.data!;
        },
        retry: false,
        queryKey: [SPACE_TRANSACTIONS_QUERY_KEY, sortBy, sortDirection, offset]
    });

    return <div className={"flex flex-col gap-6"}>
        <Button onClick={() => setCreateSpaceTransactionDialogOpened(true)}><Plus className={"w-6 h-6"}/></Button>
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className={"cursor-pointer flex flex-row gap-2 items-center"} onClick={() => {
                        if (sortBy === "date") {
                            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                        }
                        setSortBy("date");
                    }}>At{sortBy === "date" ? (sortDirection === "asc" ? <ArrowUpAZ/> :
                        <ArrowDownZA/>) : <></>}</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Created by</TableHead>
                    <TableHead className={"cursor-pointer flex flex-row gap-2 items-center"} onClick={() => {
                        if (sortBy === "createdAt") {
                            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
                        }
                        setSortBy("createdAt");
                    }}>Added at{sortBy === "createdAt" ? (sortDirection === "asc" ? <ArrowUpAZ/> :
                        <ArrowDownZA/>) : <></>}</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {
                    spaceTransactions.data ?
                        spaceTransactions.data.transactions.map(transaction =>
                            <TableRow key={transaction.id}>
                                <TableCell>{new Date(transaction.date).toLocaleString()}</TableCell>
                                <TableCell><Money amount={transaction.amount}
                                                  negate={transaction.type === "withdrawal"}/></TableCell>
                                <TableCell>{transaction.comment ?? "-"} {transaction.relatedMemberTransactionSubject ?
                                    <>from <MemberLink member={transaction.relatedMemberTransactionSubject}/></> : <></>}
                                </TableCell>
                                <TableCell>{getTextTransactionType(transaction)}</TableCell>
                                <TableCell><MemberLink member={transaction.actor}/></TableCell>
                                <TableCell>{new Date(transaction.createdAt).toLocaleString()}</TableCell>
                            </TableRow>) : <>
                            {[...Array(10)].map((value, index) => <EmptyTableRow key={index}/>)}
                        </>
                }
            </TableBody>
        </Table>
        <Paginator onChange={page => setOffset((page - 1) * TRANSACTIONS_PER_PAGE)}
                   current={Math.floor(offset / TRANSACTIONS_PER_PAGE) + 1}
                   max={Math.floor(((spaceTransactions.data?.count ?? 0) +
                       TRANSACTIONS_PER_PAGE - 1) / TRANSACTIONS_PER_PAGE)}/>
        <CreateSpaceTransactionDialog open={createSpaceTransactionDialogOpened}
                                      onClose={() => setCreateSpaceTransactionDialogOpened(false)}/>
    </div>;
}