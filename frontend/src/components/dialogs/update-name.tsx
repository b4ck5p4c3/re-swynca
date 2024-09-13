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


const updateNameDialogForm = z.object({
    name: z.string()
});

type UpdateNameDialogData = z.infer<typeof updateNameDialogForm>;

export function UpdateNameDialog({open, onClose, member}: DefaultDialogProps & { member: MemberDTO }) {
    const form = useForm<UpdateNameDialogData>({
        resolver: zodResolver(updateNameDialogForm)
    });

    const client = getClient();

    const queryClient = useQueryClient();

    const updateName = useMutation({
        mutationFn: async (data: UpdateNameDialogData) => {
            R(await client.PATCH("/api/members/{id}", {
                body: {
                    name: data.name,
                    email: member.email
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
        if (!open) {
            onClose();
        }
    }

    useEffect(() => {
        if (open) {
            form.reset({
                name: member.name
            });
        }
    }, [open]);

    return <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Update name</DialogTitle>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(data => updateName.mutate(data))}>
                    <div className={"flex flex-col gap-4 mb-4"}>
                        <FormField
                            control={form.control}
                            name="name"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Dmitry Pepperstein" {...field} />
                                    </FormControl>
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