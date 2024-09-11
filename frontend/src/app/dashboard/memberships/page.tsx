"use client";

import {getClient, R} from "@/lib/api/client";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {MEMBERS_QUERY_KEY, MEMBERSHIPS_QUERY_KEY} from "@/lib/cache-tags";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {GitHubLink} from "@/components/github-link";
import {TelegramLink} from "@/components/telegram-link";
import {Badge} from "@/components/ui/badge";
import {z} from "zod";
import {DefaultDialogProps, MembershipDTO} from "@/lib/types";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {useEffect, useState} from "react";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Switch} from "@/components/ui/switch";

const createMembershipForm = z.object({
    title: z.string(),
    amount: z.string().regex(/^(-?)(\d+)((\.(\d+))?)$/ig, {
        message: "Amount should be number"
    }),
    active: z.boolean()
});

type CreateMembershipData = z.infer<typeof createMembershipForm>;

export function CreateMembershipDialog({open, onClose}: DefaultDialogProps) {
    const form = useForm<CreateMembershipData>({
        resolver: zodResolver(createMembershipForm)
    });

    const client = getClient();

    const queryClient = useQueryClient();

    const createMembership = useMutation({
        mutationFn: async (data: CreateMembershipData) => {
            R(await client.POST("/api/memberships", {
                body: {
                    title: data.title,
                    amount: data.amount,
                    active: data.active
                }
            }));
        },
        onSuccess: async () => {
            onClose();
            await queryClient.refetchQueries({queryKey: [MEMBERSHIPS_QUERY_KEY]})
        }
    });

    function onOpenChange(open: boolean) {
        if (!open) {
            onClose();
        }
    }

    useEffect(() => {
        if (open) {
            form.reset();
        }
    }, [open]);

    return <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Create new membership</DialogTitle>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(data => createMembership.mutate(data))}>
                    <div className={"flex flex-col gap-4 mb-4"}>
                        <FormField
                            control={form.control}
                            name="title"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Table DLC" {...field} />
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
                                        <Input placeholder="1337.00" {...field} />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="active"
                            render={({field}) => (
                                <FormItem>
                                    <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange}/>
                                    </FormControl>
                                    <FormLabel>Is active?</FormLabel>
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

const updateMembershipForm = z.object({
    title: z.string(),
    amount: z.string().regex(/^(-?)(\d+)((\.(\d+))?)$/ig, {
        message: "Amount should be number"
    }),
    active: z.boolean()
});

type UpdateMembershipData = z.infer<typeof updateMembershipForm>;

export function UpdateMembershipDialog({open, onClose, current}: DefaultDialogProps & { current: MembershipDTO }) {
    const form = useForm<UpdateMembershipData>({
        resolver: zodResolver(updateMembershipForm)
    });

    const client = getClient();

    const queryClient = useQueryClient();

    const updateMembership = useMutation({
        mutationFn: async (data: UpdateMembershipData) => {
            R(await client.PATCH("/api/memberships/{id}", {
                body: {
                    title: data.title,
                    amount: data.amount,
                    active: data.active
                },
                params: {
                    path: {
                        id: current.id
                    }
                }
            }));
        },
        onSuccess: async () => {
            onClose();
            await queryClient.refetchQueries({queryKey: [MEMBERSHIPS_QUERY_KEY]})
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
                title: current.title,
                amount: current.amount,
                active: current.active
            });
        }
    }, [open]);

    return <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit membership</DialogTitle>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(data => updateMembership.mutate(data))}>
                    <div className={"flex flex-col gap-4 mb-4"}>
                        <FormField
                            control={form.control}
                            name="title"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Table DLC" {...field} />
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
                                        <Input placeholder="1337.00" {...field} />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="active"
                            render={({field}) => (
                                <FormItem>
                                    <FormControl>
                                        <Switch checked={field.value} onCheckedChange={field.onChange}/>
                                    </FormControl>
                                    <FormLabel>Is active?</FormLabel>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                    </div>
                    <DialogFooter>
                        <Button type={"submit"}>Update</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>;
}

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
                    }}>
                        <TableCell>{membership.title}</TableCell>
                        <TableCell>{membership.amount}</TableCell>
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