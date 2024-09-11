"use client";

import {useParams} from "next/navigation";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {getClient, R} from "@/lib/api/client";
import {
    MEMBER_ACS_KEYS_QUERY_KEY,
    MEMBER_QUERY_KEY,
    MEMBER_SUBSCRIPTIONS_QUERY_KEY,
    MEMBERSHIPS_QUERY_KEY
} from "@/lib/cache-tags";
import React, {useEffect, useState} from "react";
import {Skeleton} from "@/components/ui/skeleton";
import {Separator} from "@/components/ui/separator";
import {Button} from "@/components/ui/button";
import {IdCardIcon, Pencil1Icon, PlusIcon, TrashIcon} from "@radix-ui/react-icons";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {DefaultDialogProps, MembershipDTO} from "@/lib/types";
import {z} from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Switch} from "@/components/ui/switch";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";

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

const ACS_KEY_TYPE_MAPPING: Record<"pan" | "uid", React.ReactNode> = {
    "pan": "💳",
    "uid": "🔑"
};

const subscribeForm = z.object({
    membershipId: z.string()
});

type SubscribeData = z.infer<typeof subscribeForm>;

export function SubscribeDialog({open, onClose, availableMemberships, memberId}: DefaultDialogProps & {
    availableMemberships: MembershipDTO[],
    memberId: string
}) {
    const form = useForm<SubscribeData>({
        resolver: zodResolver(subscribeForm)
    });

    const client = getClient();

    const queryClient = useQueryClient();

    const subscribe = useMutation({
        mutationFn: async (data: SubscribeData) => {
            R(await client.POST("/api/membership-subscriptions", {
                body: {
                    memberId,
                    membershipId: data.membershipId
                }
            }));
        },
        onSuccess: async () => {
            onClose();
            await queryClient.refetchQueries({queryKey: [`${MEMBER_SUBSCRIPTIONS_QUERY_KEY}-${memberId}`]})
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
                <DialogTitle>Subscribe to</DialogTitle>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(data => subscribe.mutate(data))}>
                    <div className={"flex flex-col gap-4 mb-4"}>
                        <FormField
                            control={form.control}
                            name="membershipId"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Membership</FormLabel>
                                    <FormControl>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select membership"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    {
                                                        availableMemberships.map(membership =>
                                                            <SelectItem value={membership.id}>
                                                                {membership.title} - {membership.amount}
                                                            </SelectItem>
                                                        )
                                                    }
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                    </div>
                    <DialogFooter>
                        <Button type={"submit"}>Subscribe</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>;
}

export default function MemberPage() {
    const [subscribeDialogOpened, setSubscribeDialogOpened] = useState(false);

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

    const memberships = useQuery({
        queryFn: async () => {
            const memberships = R(await client.GET("/api/memberships", {}));
            return memberships.data!;
        },
        queryKey: [MEMBERSHIPS_QUERY_KEY],
        retry: false
    });

    const memberSubscriptions = useQuery({
        queryFn: async () => {
            const memberSubscriptions = R(await client.GET("/api/membership-subscriptions/member/{memberId}", {
                params: {
                    path: {
                        memberId: id
                    }
                }
            }));

            return memberSubscriptions.data!;
        },
        queryKey: [`${MEMBER_SUBSCRIPTIONS_QUERY_KEY}-${id}`],
        retry: false
    });

    const queryClient = useQueryClient();

    const unsubscribe = useMutation(({
        mutationFn: async (id: string) => {
            R(await client.DELETE("/api/membership-subscriptions/{id}", {
                params: {
                    path: {
                        id
                    }
                }
            }));
        },
        onSuccess: async () => {
            await queryClient.refetchQueries({queryKey: [`${MEMBER_SUBSCRIPTIONS_QUERY_KEY}-${id}`]})
        }
    }));

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
            <MemberInfoRow title={"Status"}>{member.data ?
                <div className={"flex flex-row gap-2"}>
                    <div className={"leading-8"}>{member.data.status === "active" ? "Active" : "Frozen"}</div>
                    <Button variant={member.data.status === "active" ? "destructive" : "default"}>
                        {member.data.status === "active" ? "Freeze" : "Unfreeze"}
                    </Button>
                </div> :
                <Skeleton className={"h-[36px] w-[60px]"}/>}</MemberInfoRow>
            <Separator/>
            <MemberInfoRow title={"Telegram"}>{member.data ?
                <TelegramMetadata metadata={member.data.telegramMetadata}/> :
                <Skeleton className={"h-[32px] w-[120px]"}/>}</MemberInfoRow>
            <MemberInfoRow title={"GitHub"}>{member.data ?
                <GitHubMetadata metadata={member.data.githubMetadata}/> :
                <Skeleton className={"h-[32px] w-[80px]"}/>}</MemberInfoRow>
            <Separator/>
            <div className={"flex flex-row"}>
                <div className={"text-2xl font-semibold"}>Subscriptions:</div>
                <div className={"flex-1"}/>
                {memberSubscriptions.data && memberships.data ?
                    <Button onClick={() => setSubscribeDialogOpened(true)}>Subscribe</Button> :
                    <Skeleton className={"w-[70px] h-[36px]"}/>}
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Membership</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Subscribed at</TableHead>
                        <TableHead>Declined at</TableHead>
                        <TableHead></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {memberships.data && memberSubscriptions.data ? memberSubscriptions.data.slice(0)
                            .sort((a, b) => new Date(b.subscribedAt).getTime() - new Date(a.subscribedAt).getTime())
                            .map(subscription =>
                                <TableRow>
                                    <TableCell>{memberships.data.find(membership =>
                                        membership.id === subscription.membershipId)?.title ?? "???"}</TableCell>
                                    <TableCell>{memberships.data.find(membership =>
                                        membership.id === subscription.membershipId)?.amount ?? "???"}</TableCell>
                                    <TableCell>{new Date(subscription.subscribedAt).toLocaleDateString()}</TableCell>
                                    <TableCell>{subscription.declinedAt ? new Date(subscription.declinedAt).toLocaleDateString() : "-"}</TableCell>
                                    <TableCell>{subscription.declinedAt ? <></> :
                                        <Button variant={"destructive"}
                                                onClick={() => unsubscribe.mutate(subscription.id)}>Unsubscribe</Button>}</TableCell>
                                </TableRow>) :
                        <TableRow>
                            <TableCell><Skeleton className={"h-[24px] w-[50px]"}/></TableCell>
                            <TableCell><Skeleton className={"h-[24px] w-[60px]"}/></TableCell>
                            <TableCell><Skeleton className={"h-[24px] w-[80px]"}/></TableCell>
                            <TableCell><Skeleton className={"h-[24px] w-[80px]"}/></TableCell>
                            <TableCell></TableCell>
                        </TableRow>}
                </TableBody>
            </Table>
            <Separator/>
            <div className={"flex flex-row"}>
                <div className={"text-2xl font-semibold"}>ACS keys:</div>
                <div className={"flex-1"}/>
                <Button>Add</Button>
            </div>
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
                            <TableRow className={"cursor-pointer"}>
                                <TableCell>{acsKey.name}</TableCell>
                                <TableCell>{ACS_KEY_TYPE_MAPPING[acsKey.type]}</TableCell>
                                <TableCell>{acsKey.key}</TableCell>
                            </TableRow>) :
                        <TableRow>
                            <TableCell><Skeleton className={"h-[24px] w-[60px]"}/></TableCell>
                            <TableCell><Skeleton className={"h-[24px] w-[40px]"}/></TableCell>
                            <TableCell><Skeleton className={"h-[24px] w-[80px]"}/></TableCell>
                        </TableRow>}
                </TableBody>
            </Table>
        </div>
        {memberSubscriptions.data && memberships.data ?
            <SubscribeDialog open={subscribeDialogOpened} onClose={() => setSubscribeDialogOpened(false)}
                             availableMemberships={memberships.data
                                 .filter(membership => membership.active)
                                 .filter(membership => !memberSubscriptions.data.find(subscription =>
                                     !subscription.declinedAt && subscription.membershipId === membership.id))
                             }
                             memberId={id}/>
            : <></>}
    </div>;
}