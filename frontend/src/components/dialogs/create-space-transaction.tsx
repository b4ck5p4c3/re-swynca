import {z} from "zod";
import {DefaultDialogProps} from "@/lib/types";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {getClient, R} from "@/lib/api/client";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {SPACE_TRANSACTIONS_QUERY_KEY} from "@/lib/cache-tags";
import React, {useEffect} from "react";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";

const createSpaceTransactionForm = z.object({
    type: z.string(),
    amount: z.string().regex(/^(-?)(\d+)((\.(\d+))?)$/ig, {
        message: "Amount should be number"
    }),
    comment: z.string().optional(),
    date: z.string(),
    source: z.string().optional(),
    target: z.string().optional(),
});

type CreateSpaceTransactionData = z.infer<typeof createSpaceTransactionForm>;

export function CreateSpaceTransactionDialog({open, onClose}: DefaultDialogProps) {
    const form = useForm<CreateSpaceTransactionData>({
        resolver: zodResolver(createSpaceTransactionForm)
    });

    const watchType = form.watch("type");

    const client = getClient();

    const queryClient = useQueryClient();

    const createSpaceTransaction = useMutation({
        mutationFn: async (data: CreateSpaceTransactionData) => {
            R(await client.POST("/api/space-transactions", {
                body: {
                    type: data.type as "deposit" | "withdrawal",
                    amount: data.amount,
                    comment: data.comment,
                    date: new Date(data.date).toISOString(),
                    source: data.type === "deposit" ? (data.source as "magic" | "donate" | "topup") : undefined,
                    target: data.type === "withdrawal" ? (data.target as "magic" | "basic" | "purchases") : undefined,
                }
            }));
        },
        onSuccess: async () => {
            onClose();
            await queryClient.refetchQueries({queryKey: [SPACE_TRANSACTIONS_QUERY_KEY]})
        }
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
                target: "basic",
                date: new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60 * 1000)
                    .toISOString().replace(/:\d\d\.\d\d\dZ$/, "")
            });
        }
    }, [open, form]);

    return <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Add space transaction</DialogTitle>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(data => createSpaceTransaction.mutate(data))}>
                    <div className={"flex flex-col gap-4 mb-4"}>
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
                                watchType !== "withdrawal" ? <></> :  <FormItem>
                                    <FormLabel>Target</FormLabel>
                                    <FormControl>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select target"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectItem value={"basic"}>Basic</SelectItem>
                                                    <SelectItem value={"purchases"}>Purchases</SelectItem>
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