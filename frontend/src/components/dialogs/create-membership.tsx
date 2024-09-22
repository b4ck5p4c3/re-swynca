import {z} from "zod";
import {DefaultDialogProps} from "@/lib/types";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {getClient, R} from "@/lib/api/client";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {MEMBERSHIPS_QUERY_KEY} from "@/lib/cache-tags";
import {useEffect} from "react";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Switch} from "@/components/ui/switch";
import {Button} from "@/components/ui/button";

const createMembershipForm = z.object({
    title: z.string(),
    amount: z.string().regex(/^(-?)(\d+)((\.(\d+))?)$/ig, {
        message: "Amount should be number"
    }),
    active: z.boolean()
});

type CreateMembershipData = z.infer<typeof createMembershipForm>;

export function CreateMembershipDialog({open, onClose}: DefaultDialogProps) {
    const form = useForm<CreateMembershipData>({
        resolver: zodResolver(createMembershipForm)
    });

    const client = getClient();

    const queryClient = useQueryClient();

    const createMembership = useMutation({
        mutationFn: async (data: CreateMembershipData) => {
            R(await client.POST("/api/memberships", {
                body: {
                    title: data.title,
                    amount: data.amount,
                    active: data.active
                }
            }));
        },
        onSuccess: async () => {
            onClose();
            await queryClient.refetchQueries({queryKey: [MEMBERSHIPS_QUERY_KEY]})
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
                <DialogTitle>Create new membership</DialogTitle>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(data => createMembership.mutate(data))}>
                    <div className={"flex flex-col gap-4 mb-4"}>
                        <FormField
                            control={form.control}
                            name="title"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Title</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Table DLC" {...field} />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="amount"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Amount</FormLabel>
                                    <FormControl>
                                        <Input placeholder="1337.00" {...field} />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="active"
                            render={({field}) => (
                                <FormItem>
                                    <div className={"flex flex-row gap-2 items-center"}>
                                        <FormControl>
                                            <Switch checked={field.value} onCheckedChange={field.onChange}/>
                                        </FormControl>
                                        <FormLabel>Is active?</FormLabel>
                                    </div>
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