"use client";

import {getClient, R} from "@/lib/api/client";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {MEMBERS_QUERY_KEY} from "@/lib/cache-tags";
import {GitHubLink} from "@/components/github-link";
import {TelegramLink} from "@/components/telegram-link";
import {Badge} from "@/components/ui/badge";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {useRouter} from "next/navigation";
import {Button} from "@/components/ui/button";
import {useEffect, useState} from "react";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {z} from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {DefaultDialogProps} from "@/lib/types";

const createMemberSchema = z.object({
    name: z.string(),
    email: z.string().email({
        message: "E-Mail must be valid"
    })
});

type CreateMemberData = z.infer<typeof createMemberSchema>;

export function CreateMemberDialog({open, onClose}: DefaultDialogProps) {
    const form = useForm<CreateMemberData>({
        resolver: zodResolver(createMemberSchema)
    });

    const client = getClient();

    const queryClient = useQueryClient();

    const createMember = useMutation({
        mutationFn: async (data: CreateMemberData) => {
            R(await client.POST("/api/members", {
                body: {
                    name: data.name,
                    email: data.email
                }
            }));
        },
        onSuccess: async () => {
            onClose();
            await queryClient.refetchQueries({queryKey: [MEMBERS_QUERY_KEY]})
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
                <DialogTitle>Create new member</DialogTitle>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(data => createMember.mutate(data))}>
                    <div className={"flex flex-col gap-4 mb-4"}>
                        <FormField
                            control={form.control}
                            name="name"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="New member" {...field} />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>E-Mail</FormLabel>
                                    <FormControl>
                                        <Input placeholder="new-member@0x08.in" {...field} />
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
                {members.data ? members.data.map(member => <TableRow className={"cursor-pointer"}
                                                                     onClick={() => router.push(`/dashboard/members/${member.id}`)}>
                    <TableCell>{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{new Date(member.joinedAt).toLocaleDateString()}</TableCell>
                    <TableCell>{member.balance}</TableCell>
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