"use client";

import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import React, {useEffect, useRef, useState} from "react";
import {getClient, R} from "@/lib/api/client";
import {
    MEMBER_QUERY_KEY,
    MEMBER_TRANSACTIONS_QUERY_KEY,
    MEMBERS_QUERY_KEY,
    SPACE_TRANSACTIONS_QUERY_KEY
} from "@/lib/cache-tags";
import {Skeleton} from "@/components/ui/skeleton";
import {ArrowDownZA, ArrowUpAZ, Check, ChevronsUpDown, Plus} from "lucide-react";
import {Paginator} from "@/components/paginator";
import {cn, getMemberTransactionTypeText} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {z} from "zod";
import {DefaultDialogProps, MemberDTO} from "@/lib/types";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import {CreateSpaceTransactionDialog} from "@/components/dialogs/create-space-transaction";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command";
import {Popover, PopoverTrigger} from "@/components/ui/popover";
import {PopoverContent} from "@/components/ui/popover";
import {commandScore} from "@/lib/command-score";
import {getCurrentMemberId} from "@/lib/auth-storage";

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
            <Skeleton className={"w-[75px] h-[24px]"}/>
        </TableCell>
        <TableCell>
            <Skeleton className={"w-[70px] h-[24px]"}/>
        </TableCell>
        <TableCell>
            <Skeleton className={"w-[80px] h-[24px]"}/>
        </TableCell>
    </TableRow>;
}


const createMemberTransactionForm = z.object({
    type: z.string(),
    amount: z.string().regex(/^(-?)(\d+)((\.(\d+))?)$/ig, {
        message: "Amount should be number"
    }),
    comment: z.string().optional(),
    date: z.string(),
    source: z.string().optional(),
    target: z.string().optional(),
    subjectId: z.string()
});

type CreateMemberTransactionData = z.infer<typeof createMemberTransactionForm>;

function formatMemberLabel(member?: MemberDTO) {
    if (!member) {
        return undefined;
    }
    return `${member.name} (${member.email})`;
}

export function CreateMemberTransactionDialog({open, onClose}: DefaultDialogProps) {
    const form = useForm<CreateMemberTransactionData>({
        resolver: zodResolver(createMemberTransactionForm)
    });

    const memberSelectButtonRef = useRef<HTMLButtonElement>(null);

    const [memberSelectOpened, setMemberSelectOpened] = useState(false);

    const watchType = form.watch("type");

    const client = getClient();

    const queryClient = useQueryClient();

    const createMemberTransaction = useMutation({
        mutationFn: async (data: CreateMemberTransactionData) => {
            R(await client.POST("/api/member-transactions", {
                body: {
                    type: data.type as "deposit" | "withdrawal",
                    amount: data.amount,
                    comment: data.comment,
                    date: new Date(data.date).toISOString(),
                    source: data.type === "deposit" ? (data.source as "magic" | "donate" | "topup") : undefined,
                    target: data.type === "withdrawal" ? (data.target as "magic" | "membership") : undefined,
                    subjectId: data.subjectId
                }
            }));
        },
        onSuccess: async () => {
            onClose();
            await queryClient.refetchQueries({queryKey: [MEMBER_TRANSACTIONS_QUERY_KEY]});
            await queryClient.refetchQueries({queryKey: [SPACE_TRANSACTIONS_QUERY_KEY]});
            await queryClient.refetchQueries({queryKey: [MEMBER_QUERY_KEY, getCurrentMemberId()]});
        }
    });

    const members = useQuery({
        queryFn: async () => {
            const response = R(await client.GET("/api/members", {}));
            return response.data!;
        },
        retry: false,
        queryKey: [MEMBERS_QUERY_KEY]
    });

    function onOpenChange(open: boolean) {
        if (!open) {
            onClose();
        }
    }

    useEffect(() => {
        if (open) {
            form.reset({
                type: "deposit",
                source: "donate",
                target: "membership",
                date: new Date().toISOString().replace(/:\d\d\.\d\d\dZ$/, "")
            });
        }
    }, [open]);

    return <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Add member transaction</DialogTitle>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(data => createMemberTransaction.mutate(data))}>
                    <div className={"flex flex-col gap-4 mb-4"}>
                        <FormField
                            control={form.control}
                            name="subjectId"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Done by</FormLabel>
                                    <FormControl>
                                        <div className={"block"}>
                                            <Popover open={memberSelectOpened} onOpenChange={setMemberSelectOpened}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant={"outline"}
                                                        role={"combobox"}
                                                        aria-expanded={open}
                                                        className={"justify-between w-full"}
                                                        ref={memberSelectButtonRef}
                                                    >
                                                        {field.value && members.data
                                                            ? (formatMemberLabel(members.data.find((member) =>
                                                                member.id === field.value)) ?? "Select member...")
                                                            : "Select member..."}
                                                        <ChevronsUpDown className={"ml-2 h-4 w-4 shrink-0 opacity-50"}/>
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className={"min-ww-[200px] p-0"} style={{width: memberSelectButtonRef.current?.clientWidth}}>
                                                    <Command filter={(value, search, keywords) => {
                                                        const label = members.data ? formatMemberLabel(
                                                            members.data.find((member) =>
                                                            member.id === value)) ?? "" : "";
                                                        return commandScore(label, search, keywords);
                                                    }}>
                                                        <CommandInput placeholder={"Search member..."}/>
                                                        <CommandList>
                                                            <CommandEmpty>No member found</CommandEmpty>
                                                            <CommandGroup>
                                                                {members.data ? members.data.toSorted((a, b) =>
                                                                    a.name < b.name ? -1 : a.name === b.name ? 0 : 1).map((member) => (
                                                                    <CommandItem
                                                                        key={member.id}
                                                                        value={member.id}

                                                                        onSelect={(currentValue) => {
                                                                            field.onChange(currentValue);
                                                                            setMemberSelectOpened(false);
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                field.value === member.id ? "opacity-100" : "opacity-0"
                                                                            )}
                                                                        />
                                                                        {formatMemberLabel(member)}
                                                                    </CommandItem>
                                                                )) : <></>}
                                                            </CommandGroup>
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="type"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Funds direction</FormLabel>
                                    <FormControl>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select type"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectItem value={"deposit"}>Deposit</SelectItem>
                                                    <SelectItem value={"withdrawal"}>Withdrawal</SelectItem>
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="source"
                            render={({field}) => (
                                watchType !== "deposit" ? <></> : <FormItem>
                                    <FormLabel>Source</FormLabel>
                                    <FormControl>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select source"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectItem value={"donate"}>Donate</SelectItem>
                                                    <SelectItem value={"topup"}>Topup</SelectItem>
                                                    <SelectItem value={"magic"}>Magic</SelectItem>
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="target"
                            render={({field}) => (
                                watchType !== "withdrawal" ? <></> : <FormItem>
                                    <FormLabel>Target</FormLabel>
                                    <FormControl>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select target"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectItem value={"membership"}>Membership</SelectItem>
                                                    <SelectItem value={"magic"}>Magic</SelectItem>
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Amount</FormLabel>
                                    <FormControl>
                                        <Input placeholder="146.00" {...field} />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="comment"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Comment</FormLabel>
                                    <FormControl>
                                        <Input placeholder="За приятную ночь" {...field} />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="date"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Date</FormLabel>
                                    <FormControl>
                                        <Input {...field} type={"datetime-local"}/>
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                    </div>
                    <DialogFooter>
                        <Button type={"submit"}>Create</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>;
}

export default function MemberTransactionsPage() {
    const [offset, setOffset] = useState(0);
    const [sortBy, setSortBy] = useState<"date" | "createdAt">("date");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
    const [createMemberTransactionDialogOpened, setCreateMemberTransactionDialogOpened] = useState(false);

    const client = getClient();

    const memberTransactions = useQuery({
        queryFn: async () => {
            const response = R(await client.GET("/api/member-transactions", {
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
        queryKey: [MEMBER_TRANSACTIONS_QUERY_KEY, sortBy, sortDirection, offset]
    });

    return <div className={"flex flex-col gap-6 mb-10"}>
        <Button onClick={() => setCreateMemberTransactionDialogOpened(true)}><Plus className={"w-6 h-6"}/></Button>
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
                    memberTransactions.data ?
                        memberTransactions.data.transactions.map(transaction =>
                            <TableRow>
                                <TableCell>{new Date(transaction.date).toLocaleString()}</TableCell>
                                <TableCell>{transaction.amount}</TableCell>
                                <TableCell>{transaction.comment ?? "-"}</TableCell>
                                <TableCell>{getMemberTransactionTypeText(transaction)}</TableCell>
                                <TableCell><a className={"underline"}
                                              href={`/dashboard/members/${transaction.subject.id}`}
                                              target={"_blank"}>{transaction.subject.name}</a></TableCell>
                                <TableCell><a className={"underline"}
                                              href={`/dashboard/members/${transaction.actor.id}`}
                                              target={"_blank"}>{transaction.actor.name}</a></TableCell>
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
        <CreateMemberTransactionDialog open={createMemberTransactionDialogOpened}
                                       onClose={() => setCreateMemberTransactionDialogOpened(false)}/>
    </div>;
}