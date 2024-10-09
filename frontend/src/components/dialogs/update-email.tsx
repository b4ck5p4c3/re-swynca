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

const updateEMailDialogForm = z.object({
    email: z.string().email()
});

type UpdateEMailDialogData = z.infer<typeof updateEMailDialogForm>;

export function UpdateEMailDialog({open, onClose, member}: DefaultDialogProps & { member: MemberDTO }) {
    const form = useForm<UpdateEMailDialogData>({
        resolver: zodResolver(updateEMailDialogForm)
    });

    const client = getClient();

    const queryClient = useQueryClient();

    const updateEMail = useMutation({
        mutationFn: async (data: UpdateEMailDialogData) => {
            R(await client.PATCH("/api/members/{id}", {
                body: {
                    name: member.name,
                    email: data.email,
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
        if (!open && !updateEMail.isPending) {
            onClose();
        }
    }

    useEffect(() => {
        if (open) {
            form.reset({
                email: member.email
            });
        }
    }, [open, form, member]);

    return <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Update E-Mail</DialogTitle>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(data => updateEMail.mutate(data))}>
                    <div className={"flex flex-col gap-4 mb-4"}>
                        <FormField
                            control={form.control}
                            name="email"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>E-Mail</FormLabel>
                                    <FormControl>
                                        <Input placeholder="dev@0x08.in" disabled={updateEMail.isPending} {...field} />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                    </div>
                    <DialogFooter>
                        <Button type={"submit"} disabled={updateEMail.isPending}>Update</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>;
}
