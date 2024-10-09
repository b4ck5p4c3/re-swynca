import {z} from "zod";
import {DefaultDialogProps} from "@/lib/types";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {getClient, R} from "@/lib/api/client";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {MEMBERS_QUERY_KEY} from "@/lib/cache-tags";
import {useEffect} from "react";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";

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
        if (!open && !createMember.isPending) {
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
                                        <Input placeholder="New member" disabled={createMember.isPending} {...field} />
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
                                        <Input placeholder="new-member@0x08.in"
                                               disabled={createMember.isPending} {...field} />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                    </div>
                    <DialogFooter>
                        <Button type={"submit"} disabled={createMember.isPending}>Create</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog>;
}