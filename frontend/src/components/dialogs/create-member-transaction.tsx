import {z} from "zod";
import {DefaultDialogProps, MemberDTO} from "@/lib/types";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import React, {useEffect, useRef, useState} from "react";
import {getClient, R} from "@/lib/api/client";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {
    MEMBER_QUERY_KEY,
    MEMBER_TRANSACTIONS_QUERY_KEY,
    MEMBERS_QUERY_KEY,
    SPACE_TRANSACTIONS_QUERY_KEY
} from "@/lib/cache-tags";
import {getCurrentMemberId} from "@/lib/auth-storage";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Button} from "@/components/ui/button";
import {Check, ChevronsUpDown} from "lucide-react";
import {Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList} from "@/components/ui/command";
import {commandScore} from "@/lib/command-score";
import {cn} from "@/lib/utils";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Input} from "@/components/ui/input";


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
                date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60 * 1000)
                    .toISOString().replace(/:\d\d\.\d\d\dZ$/, "")
            });
        }
    }, [open, form]);

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
                                                <PopoverContent className={"min-ww-[200px] p-0"}
                                                                style={{width: memberSelectButtonRef.current?.clientWidth}}>
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