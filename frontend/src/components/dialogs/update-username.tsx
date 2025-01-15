import {z} from "zod";
import {DefaultDialogProps, MemberDTO} from "@/lib/types";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {getClient, R} from "@/lib/api/client";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {MEMBER_QUERY_KEY} from "@/lib/cache-tags";
import React, {useEffect} from "react";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";

const updateUsernameDialogForm = z.object({
    username: z.string()
});

type UpdateUsernameDialogData = z.infer<typeof updateUsernameDialogForm>;

export function UpdateUsernameDialog({open, onClose, member}: DefaultDialogProps & { member: MemberDTO }) {
    const form = useForm<UpdateUsernameDialogData>({
        resolver: zodResolver(updateUsernameDialogForm)
    });

    const client = getClient();

    const queryClient = useQueryClient();

    const updateUsername = useMutation({
        mutationFn: async (data: UpdateUsernameDialogData) => {
            R(await client.PATCH("/api/members/{id}", {
                body: {
                    name: member.name,
                    email: member.email,
                    username: data.username
                },
                params: {
                    path: {
                        id: member.id
                    }
                }
            }));
        },
        onSuccess: async () => {
            onClose();
            await queryClient.refetchQueries({queryKey: [MEMBER_QUERY_KEY, member.id]})
        }
    });

    function onOpenChange(open: boolean) {
        if (!open && !updateUsername.isPending) {
            onClose();
        }
    }

    useEffect(() => {
        if (open) {
            form.reset({
                username: member.username
            });
        }
    }, [open, form, member]);

    return <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Update username</DialogTitle>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(data => updateUsername.mutate(data))}>
                    <div className={"flex flex-col gap-4 mb-4"}>
                        <FormField
                            control={form.control}
                            name="username"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="radioegor146" disabled={updateUsername.isPending} {...field} />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                    </div>
                    <DialogFooter>
                        <Button type={"submit"} disabled={updateUsername.isPending}>Update</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>;
}