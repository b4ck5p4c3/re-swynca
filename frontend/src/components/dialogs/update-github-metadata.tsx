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

const updateGitHubMetadataForm = z.object({
    githubUsername: z.string().regex(/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i, {
        message: "GitHub username must be valid"
    })
});

type UpdateGitHubMetadataData = z.infer<typeof updateGitHubMetadataForm>;

export function UpdateGitHubMetadataDialog({open, onClose, member}: DefaultDialogProps & { member: MemberDTO }) {
    const form = useForm<UpdateGitHubMetadataData>({
        resolver: zodResolver(updateGitHubMetadataForm)
    });

    const client = getClient();

    const queryClient = useQueryClient();

    const updateGitHubMetadata = useMutation({
        mutationFn: async (data: UpdateGitHubMetadataData) => {
            R(await client.PATCH("/api/members/{id}/github", {
                body: {
                    githubUsername: data.githubUsername
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
                githubUsername: member.githubMetadata?.githubUsername
            });
        }
    }, [open]);

    return <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Update GitHub</DialogTitle>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(data => updateGitHubMetadata.mutate(data))}>
                    <div className={"flex flex-col gap-4 mb-4"}>
                        <FormField
                            control={form.control}
                            name="githubUsername"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>GitHub username</FormLabel>
                                    <FormControl>
                                        <Input placeholder="radioegor146" {...field} />
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