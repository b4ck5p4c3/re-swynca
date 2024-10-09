import {z} from "zod";
import {DefaultDialogProps, MembershipDTO} from "@/lib/types";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {getClient, R} from "@/lib/api/client";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {MEMBER_SUBSCRIPTIONS_QUERY_KEY} from "@/lib/cache-tags";
import React, {useEffect} from "react";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {Money} from "@/components/money";

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
            await queryClient.refetchQueries({queryKey: [MEMBER_SUBSCRIPTIONS_QUERY_KEY, memberId]})
        }
    });

    function onOpenChange(open: boolean) {
        if (!open && !subscribe.isPending) {
            onClose();
        }
    }

    useEffect(() => {
        if (open) {
            form.reset();
        }
    }, [open, form]);

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
                                        <Select value={field.value} onValueChange={field.onChange}
                                                disabled={subscribe.isPending}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select membership"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    {
                                                        availableMemberships.map(membership =>
                                                            <SelectItem value={membership.id} key={membership.id}>
                                                                {membership.title} - <Money amount={membership.amount}/>
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
                        <Button type={"submit"} disabled={subscribe.isPending}>Subscribe</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>;
}