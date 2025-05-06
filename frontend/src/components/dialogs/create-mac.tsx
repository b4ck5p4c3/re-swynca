import {z} from "zod";
import {DefaultDialogProps} from "@/lib/types";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {getClient, R} from "@/lib/api/client";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {MEMBER_MACS_QUERY_KEY} from "@/lib/cache-tags";
import React, {useEffect} from "react";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";

const createMACForm = z.object({
    mac: z.string().regex(/^([0-9A-F]{2}):([0-9A-F]{2}):([0-9A-F]{2}):([0-9A-F]{2}):([0-9A-F]{2}):([0-9A-F]{2})$/i,
        "Input MAC address in form of 11:22:33:Aa:Bb:Cc"),
    description: z.string()
});

type CreateMACData = z.infer<typeof createMACForm>;

export function CreateMACDialog({open, onClose, memberId}: DefaultDialogProps & { memberId: string }) {
    const form = useForm<CreateMACData>({
        resolver: zodResolver(createMACForm)
    });

    const client = getClient();

    const queryClient = useQueryClient();

    const addMAC = useMutation({
        mutationFn: async (data: CreateMACData) => {
            R(await client.POST("/api/macs", {
                body: {
                    memberId,
                    mac: data.mac.toUpperCase(),
                    description: data.description
                }
            }));
        },
        onSuccess: async () => {
            onClose();
            await queryClient.refetchQueries({queryKey: [MEMBER_MACS_QUERY_KEY, memberId]})
        }
    });

    function onOpenChange(open: boolean) {
        if (!open && !addMAC.isPending) {
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
                <DialogTitle>Add MAC</DialogTitle>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(data => addMAC.mutate(data))}>
                    <div className={"flex flex-col gap-4 mb-4"}>
                        <FormField
                            control={form.control}
                            name={"mac"}
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>MAC</FormLabel>
                                    <FormControl>
                                        <Input placeholder="11:22:33:44:55:66"
                                               disabled={addMAC.isPending} {...field} />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={"description"}
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Input placeholder="My favorite PC"
                                               disabled={addMAC.isPending} {...field} />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                    </div>
                    <DialogFooter>
                        <Button type={"submit"} disabled={addMAC.isPending}>Add</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>;
}