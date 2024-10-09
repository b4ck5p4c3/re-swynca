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

const updateTelegramMetadataForm = z.object({
    telegramId: z.string().regex(/^(\d+)$/ig, {
        message: "Telegram ID must contain only digits (0-9)"
    })
});

type UpdateTelegramMetadataData = z.infer<typeof updateTelegramMetadataForm>;

export function UpdateTelegramMetadataDialog({open, onClose, member}: DefaultDialogProps & { member: MemberDTO }) {
    const form = useForm<UpdateTelegramMetadataData>({
        resolver: zodResolver(updateTelegramMetadataForm)
    });

    const client = getClient();

    const queryClient = useQueryClient();

    const updateTelegramMetadata = useMutation({
        mutationFn: async (data: UpdateTelegramMetadataData) => {
            R(await client.PATCH("/api/members/{id}/telegram", {
                body: {
                    telegramId: data.telegramId
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
        if (!open && !updateTelegramMetadata.isPending) {
            onClose();
        }
    }

    useEffect(() => {
        if (open) {
            form.reset({
                telegramId: member.telegramMetadata?.telegramId
            });
        }
    }, [open, form, member]);

    return <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Update Telegram</DialogTitle>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(data => updateTelegramMetadata.mutate(data))}>
                    <div className={"flex flex-col gap-4 mb-4"}>
                        <FormField
                            control={form.control}
                            name="telegramId"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Telegram ID</FormLabel>
                                    <FormControl>
                                        <Input placeholder="1023371337" disabled={updateTelegramMetadata.isPending} {...field} />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                    </div>
                    <DialogFooter>
                        <Button type={"submit"} disabled={updateTelegramMetadata.isPending}>Update</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>;
}