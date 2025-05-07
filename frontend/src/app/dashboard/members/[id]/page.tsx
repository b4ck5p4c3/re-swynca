"use client";

import React, {useState} from "react";
import {getClient, R} from "@/lib/api/client";
import {useParams} from "next/navigation";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {
    MEMBER_ACS_KEYS_QUERY_KEY, MEMBER_MACS_QUERY_KEY,
    MEMBER_QUERY_KEY,
    MEMBER_SUBSCRIPTIONS_QUERY_KEY,
    MEMBERSHIPS_QUERY_KEY
} from "@/lib/cache-tags";
import {MemberInfoRow} from "@/components/member-info-row";
import {Button} from "@/components/ui/button";
import {Pencil, Trash} from "lucide-react";
import {Skeleton} from "@/components/ui/skeleton";
import {Money} from "@/components/money";
import {Separator} from "@/components/ui/separator";
import {TelegramMetadata} from "@/components/telegram-metadata";
import {GitHubMetadata} from "@/components/github-metadata";
import {MemberSubjectedTransactions} from "@/components/member-subjected-transactions";
import {MemberActedTransactions} from "@/components/member-acted-transactions";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {SubscribeDialog} from "@/components/dialogs/subscribe";
import {CreateACSKeyDialog} from "@/components/dialogs/create-acs-key";
import {UpdateNameDialog} from "@/components/dialogs/update-name";
import {UpdateEMailDialog} from "@/components/dialogs/update-email";
import {UpdateUsernameDialog} from "@/components/dialogs/update-username";
import {CreateMACDialog} from "@/components/dialogs/create-mac";

const ACS_KEY_TYPE_MAPPING: Record<"pan" | "uid", React.ReactNode> = {
    "pan": "💳",
    "uid": "🔑"
};

export default function MemberPage() {
    const [subscribeDialogOpened, setSubscribeDialogOpened] = useState(false);
    const [createACSKeyDialogOpened, setCreateACSKeyDialogOpened] = useState(false);
    const [createMACDialogOpened, setCreateMACDialogOpened] = useState(false);
    const [updateNameDialogOpened, setUpdateNameDialogOpened] = useState(false);
    const [updateEMailDialogOpened, setUpdateEMailDialogOpened] = useState(false);
    const [updateUsernameDialogOpened, setUpdateUsernameDialogOpened] = useState(false);

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
        queryKey: [MEMBER_QUERY_KEY, id],
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
        queryKey: [MEMBER_ACS_KEYS_QUERY_KEY, id],
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
        queryKey: [MEMBER_SUBSCRIPTIONS_QUERY_KEY, id],
        retry: false
    });

    const memberMACs = useQuery({
        queryFn: async () => {
            const memberMacsData = R(await client.GET("/api/macs/member/{memberId}", {
                params: {
                    path: {
                        memberId: id
                    }
                }
            }));

            return memberMacsData.data!;
        },
        queryKey: [MEMBER_MACS_QUERY_KEY, id],
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
            await queryClient.refetchQueries({queryKey: [MEMBER_SUBSCRIPTIONS_QUERY_KEY, id]})
        }
    }));

    const removeACSKey = useMutation(({
        mutationFn: async (id: string) => {
            R(await client.DELETE("/api/acs-keys/{id}", {
                params: {
                    path: {
                        id
                    }
                }
            }));
        },
        onSuccess: async () => {
            await queryClient.refetchQueries({queryKey: [MEMBER_ACS_KEYS_QUERY_KEY, id]});
        }
    }));

    const updateMemberStatus = useMutation({
        mutationFn: async (data: "active" | "frozen") => {
            R(await client.PATCH("/api/members/{id}/status", {
                params: {
                    path: {
                        id
                    }
                },
                body: {
                    status: data
                }
            }));
        },
        onSuccess: async () => {
            await queryClient.refetchQueries({queryKey: [MEMBER_QUERY_KEY, id]});
        }
    });

    const removeMAC = useMutation(({
        mutationFn: async (id: string) => {
            R(await client.DELETE("/api/macs/{id}", {
                params: {
                    path: {
                        id
                    }
                }
            }));
        },
        onSuccess: async () => {
            await queryClient.refetchQueries({queryKey: [MEMBER_MACS_QUERY_KEY, id]});
        }
    }));

    return <div>
        <div className={"flex flex-col gap-4"}>
            <MemberInfoRow collapseWhenSm={true} title={"Name"}>{member.data ? <div className={"flex flex-row gap-2"}>
                    <div className={"leading-8"}>{member.data.name}</div>
                    <Button className={"w-8 p-0 h-8"}
                            onClick={() => setUpdateNameDialogOpened(true)}><Pencil className={"w-4 h-4"}/></Button>
                </div> :
                <Skeleton className={"h-[32px] w-[100px]"}/>}</MemberInfoRow>
            <MemberInfoRow collapseWhenSm={true} title={"E-Mail"}>{member.data ? <div className={"flex flex-row gap-2"}>
                    <div className={"leading-8"}>{member.data.email}</div>
                    <Button className={"w-8 p-0 h-8"}
                            onClick={() => setUpdateEMailDialogOpened(true)}><Pencil className={"w-4 h-4"}/></Button>
                </div> :
                <Skeleton className={"h-[24px] w-[200px]"}/>}</MemberInfoRow>
            <MemberInfoRow collapseWhenSm={true} title={"Username"}>{member.data ? <div className={"flex flex-row gap-2"}>
                    <div className={"leading-8"}>{member.data.username}</div>
                    <Button className={"w-8 p-0 h-8"}
                            onClick={() => setUpdateUsernameDialogOpened(true)}><Pencil className={"w-4 h-4"}/></Button>
                </div> :
                <Skeleton className={"h-[24px] w-[200px]"}/>}</MemberInfoRow>
            <MemberInfoRow title={"Joined at"}>{member.data ? new Date(member.data.joinedAt).toLocaleDateString() :
                <Skeleton className={"h-[24px] w-[90px]"}/>}</MemberInfoRow>
            <MemberInfoRow title={"Balance"}>{member.data ? <Money amount={member.data.balance}/> :
                <Skeleton className={"h-[24px] w-[50px]"}/>}</MemberInfoRow>
            <MemberInfoRow title={"Status"}>{member.data ?
                <div className={"flex flex-row gap-2"}>
                    <div className={"leading-8"}>{member.data.status === "active" ? "Active" : "Frozen"}</div>
                    <Button variant={member.data.status === "active" ? "destructive" : "default"} onClick={() => {
                        updateMemberStatus.mutate(member.data.status === "active" ? "frozen" : "active");
                    }} disabled={updateMemberStatus.isPending}>
                        {member.data.status === "active" ? "Freeze" : "Unfreeze"}
                    </Button>
                </div> :
                <Skeleton className={"h-[36px] w-[60px]"}/>}</MemberInfoRow>
            <Separator/>
            <MemberInfoRow collapseWhenSm={true} title={"Telegram"}>{member.data ?
                <TelegramMetadata metadata={member.data.telegramMetadata} member={member.data}/> :
                <Skeleton className={"h-[32px] w-[120px]"}/>}</MemberInfoRow>
            <MemberInfoRow collapseWhenSm={true} title={"GitHub"}>{member.data ?
                <GitHubMetadata metadata={member.data.githubMetadata} member={member.data}/> :
                <Skeleton className={"h-[32px] w-[80px]"}/>}</MemberInfoRow>
            <Separator/>
            <div className={"flex flex-col 2xl:flex-row gap-4"}>
                <MemberSubjectedTransactions memberId={id}/>
                <MemberActedTransactions memberId={id}/>
            </div>
            <Separator/>
            <div className={"flex flex-row"}>
                <div className={"text-xl font-semibold"}>Subscriptions:</div>
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
                                <TableRow key={subscription.id}>
                                    <TableCell>{memberships.data.find(membership =>
                                        membership.id === subscription.membershipId)?.title ?? "???"}</TableCell>
                                    <TableCell>{memberships.data.find(membership =>
                                        membership.id === subscription.membershipId)?.amount ?? "???"}</TableCell>
                                    <TableCell>{new Date(subscription.subscribedAt).toLocaleDateString()}</TableCell>
                                    <TableCell>{subscription.declinedAt ? new Date(subscription.declinedAt).toLocaleDateString() : "-"}</TableCell>
                                    <TableCell>{subscription.declinedAt ? <></> :
                                        <Button variant={"destructive"}
                                                disabled={unsubscribe.isPending}
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
                <div className={"text-xl font-semibold"}>ACS keys:</div>
                <div className={"flex-1"}/>
                <Button onClick={() => setCreateACSKeyDialogOpened(true)}>Add</Button>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Key</TableHead>
                        <TableHead></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {memberAcsKeys.data ? memberAcsKeys.data.map(acsKey =>
                            <TableRow key={acsKey.id}>
                                <TableCell>{acsKey.name}</TableCell>
                                <TableCell>{ACS_KEY_TYPE_MAPPING[acsKey.type]}</TableCell>
                                <TableCell>{acsKey.key}</TableCell>
                                <TableCell><Button disabled={removeACSKey.isPending} onClick={() => removeACSKey.mutate(acsKey.id)} variant={"destructive"}
                                                   className={"w-8 p-0 h-8"}><Trash
                                    className={"w-4 h-4"}/></Button></TableCell>
                            </TableRow>) :
                        <TableRow>
                            <TableCell><Skeleton className={"h-[24px] w-[60px]"}/></TableCell>
                            <TableCell><Skeleton className={"h-[24px] w-[40px]"}/></TableCell>
                            <TableCell><Skeleton className={"h-[24px] w-[80px]"}/></TableCell>
                            <TableCell></TableCell>
                        </TableRow>}
                </TableBody>
            </Table>
            <Separator/>
            <div className={"flex flex-row"}>
                <div className={"text-xl font-semibold"}>MACs:</div>
                <div className={"flex-1"}/>
                <Button onClick={() => setCreateMACDialogOpened(true)}>Add</Button>
            </div>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>MAC</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead></TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {memberMACs.data ? memberMACs.data.map(mac =>
                            <TableRow key={mac.id}>
                                <TableCell>{mac.mac}</TableCell>
                                <TableCell>{mac.description}</TableCell>
                                <TableCell><Button disabled={removeMAC.isPending} onClick={() => removeMAC.mutate(mac.id)} variant={"destructive"}
                                                   className={"w-8 p-0 h-8"}><Trash
                                    className={"w-4 h-4"}/></Button></TableCell>
                            </TableRow>) :
                        <TableRow>
                            <TableCell><Skeleton className={"h-[24px] w-[60px]"}/></TableCell>
                            <TableCell><Skeleton className={"h-[24px] w-[40px]"}/></TableCell>
                            <TableCell></TableCell>
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
        <CreateACSKeyDialog open={createACSKeyDialogOpened} onClose={() => setCreateACSKeyDialogOpened(false)}
                            memberId={id}/>
        <CreateMACDialog open={createMACDialogOpened} onClose={() => setCreateMACDialogOpened(false)}
                            memberId={id}/>
        {member.data ? <UpdateNameDialog member={member.data} open={updateNameDialogOpened}
                                         onClose={() => setUpdateNameDialogOpened(false)}/> : <></>}
        {member.data ? <UpdateEMailDialog member={member.data} open={updateEMailDialogOpened}
                                          onClose={() => setUpdateEMailDialogOpened(false)}/> : <></>}
        {member.data ? <UpdateUsernameDialog member={member.data} open={updateUsernameDialogOpened}
                                          onClose={() => setUpdateUsernameDialogOpened(false)}/> : <></>}
    </div>;
}