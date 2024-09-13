import React, {useState} from "react";
import {getClient, R} from "@/lib/api/client";
import {useQuery} from "@tanstack/react-query";
import {MEMBER_TRANSACTIONS_QUERY_KEY} from "@/lib/cache-tags";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {ArrowDownZA, ArrowUpAZ} from "lucide-react";
import {getMemberTransactionTypeText} from "@/lib/utils";
import {Paginator} from "@/components/paginator";
import {Skeleton} from "@/components/ui/skeleton";

const TRANSACTIONS_PER_PAGE = 10;

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
            <Skeleton className={"w-[75px] h-[24px]"}/>
        </TableCell>
        <TableCell>
            <Skeleton className={"w-[80px] h-[24px]"}/>
        </TableCell>
    </TableRow>;
}

export function MemberActedTransactions({memberId}: { memberId: string }) {
    const [offset, setOffset] = useState(0);
    const [sortBy, setSortBy] = useState<"date" | "createdAt">("date");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
    const [doQuery, setDoQuery] = useState(true);

    const client = getClient();

    const memberTransactions = useQuery({
        queryFn: async () => {
            const response = R(await client.GET("/api/member-transactions/actor/{memberId}", {
                params: {
                    path: {
                        memberId: memberId
                    },
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
        enabled: doQuery,
        queryKey: [MEMBER_TRANSACTIONS_QUERY_KEY, memberId, "acted", sortBy, sortDirection, offset]
    });

    return <div className={"flex-1 gap-2 flex flex-col"}>
        <div className={"text-xl font-semibold"}>Transactions created:</div>
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
                    <TableHead>Done by</TableHead>
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
                    memberTransactions.data ?
                        memberTransactions.data.transactions.map(transaction =>
                            <TableRow>
                                <TableCell>{new Date(transaction.date).toLocaleString()}</TableCell>
                                <TableCell>{transaction.amount}</TableCell>
                                <TableCell>{transaction.comment ?? "-"}</TableCell>
                                <TableCell>{getMemberTransactionTypeText(transaction)}</TableCell>
                                <TableCell><a className={"underline"} href={`/dashboard/members/${transaction.subject.id}`}
                                              target={"_blank"}>{transaction.subject.name}</a></TableCell>
                                <TableCell>{new Date(transaction.createdAt).toLocaleString()}</TableCell>
                            </TableRow>) : <>
                            {[...Array(10)].map(_ => <EmptyTableRow/>)}
                        </>
                }
            </TableBody>
        </Table>
        <Paginator onChange={page => setOffset((page - 1) * TRANSACTIONS_PER_PAGE)}
                   current={Math.floor(offset / TRANSACTIONS_PER_PAGE) + 1}
                   max={Math.floor(((memberTransactions.data?.count ?? 0) +
                       TRANSACTIONS_PER_PAGE - 1) / TRANSACTIONS_PER_PAGE)}/>
    </div>;
}