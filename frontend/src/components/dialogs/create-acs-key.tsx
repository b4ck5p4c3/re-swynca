import {z} from "zod";
import {DefaultDialogProps} from "@/lib/types";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import {getClient, R} from "@/lib/api/client";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {MEMBER_ACS_KEYS_QUERY_KEY} from "@/lib/cache-tags";
import React, {useEffect, useState} from "react";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {PlantainPANConverter} from "@/components/dialogs/plantain-pan-converter";

const createACSKeyForm = z.object({
    name: z.string(),
    type: z.string(),
    key: z.string()
});

type CreateACSKeyData = z.infer<typeof createACSKeyForm>;

export function CreateACSKeyDialog({open, onClose, memberId}: DefaultDialogProps & { memberId: string }) {
    const form = useForm<CreateACSKeyData>({
        resolver: zodResolver(createACSKeyForm),
        defaultValues: {
            type: "uid"
        }
    });

    const [plantainConverterOpen, setPlantainConverterOpen] = useState(false);

    const client = getClient();

    const queryClient = useQueryClient();

    const addACSKey = useMutation({
        mutationFn: async (data: CreateACSKeyData) => {
            R(await client.POST("/api/acs-keys", {
                body: {
                    memberId,
                    name: data.name,
                    type: data.type as ("pan" | "uid"),
                    key: data.key
                }
            }));
        },
        onSuccess: async () => {
            onClose();
            await queryClient.refetchQueries({queryKey: [MEMBER_ACS_KEYS_QUERY_KEY, memberId]})
        }
    });

    function onOpenChange(open: boolean) {
        if (!open && !addACSKey.isPending) {
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
                <DialogTitle>Add ACS key</DialogTitle>
            </DialogHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(data => addACSKey.mutate(data))}>
                    <div className={"flex flex-col gap-4 mb-4"}>
                        <FormField
                            control={form.control}
                            name="name"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="My favourite key"
                                               disabled={addACSKey.isPending} {...field} />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="type"
                            render={({field}) => (
                                <FormItem>
                                    <FormLabel>Type</FormLabel>
                                    <FormControl>
                                        <Select value={field.value} onValueChange={field.onChange}
                                                disabled={addACSKey.isPending}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select key type"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectGroup>
                                                    <SelectItem value={"uid"}>NFC UID</SelectItem>
                                                    <SelectItem value={"pan"}>Bank card PAN</SelectItem>
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="key"
                            render={({field}) => {
                                const type = form.watch("type");
                                return (
                                    <FormItem>
                                        <FormLabel>{type === 'pan' ? 'Card No.' : 'NFC UID'}</FormLabel>
                                        <FormControl>
                                            <Input 
                                                className="font-mono"
                                                placeholder={type === "pan" ? "1234 5678 9012 3456" : "0123456789ABCD"} 
                                                disabled={addACSKey.isPending}  
                                                {...field} 
                                            />
                                        </FormControl>
                                        {type === "uid" && (
                                            <button
                                                type="button"
                                                onClick={() => setPlantainConverterOpen(true)}
                                                className="text-xs font-semibold underline underline-offset-4"
                                            >
                                                Use Podorozhnik Number instead ↗
                                            </button>
                                        )}
                                        <FormMessage/>
                                    </FormItem>
                                );
                            }}
                        />
                    </div>
                    <DialogFooter>
                        <Button type={"submit"} disabled={addACSKey.isPending}>Add</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
        <PlantainPANConverter
            open={plantainConverterOpen}
            onClose={() => setPlantainConverterOpen(false)}
            onApply={(uid) => form.setValue("key", uid)}
        />
    </Dialog>;
}