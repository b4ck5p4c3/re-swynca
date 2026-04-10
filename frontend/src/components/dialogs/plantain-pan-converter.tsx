import {z} from "zod";
import {useForm} from "react-hook-form";
import {zodResolver} from "@hookform/resolvers/zod";
import React from "react";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {PlantainPANSchema, convertPlantainPANToUID} from "@/lib/nfc";

const plantainConverterForm = z.object({
    plantainNumber: PlantainPANSchema
});

type PlantainConverterData = z.infer<typeof plantainConverterForm>;

interface PlantainPANConverterProps {
    open: boolean;
    onClose: () => void;
    onApply: (uid: string) => void;
}

export function PlantainPANConverter({open, onClose, onApply}: PlantainPANConverterProps) {
    const form = useForm<PlantainConverterData>({
        resolver: zodResolver(plantainConverterForm),
        mode: "onChange"
    });

    function handleApply(data: PlantainConverterData) {
        const uid = convertPlantainPANToUID(data.plantainNumber);
        onApply(uid);
        onClose();
        form.reset();
    }

    function onOpenChange(open: boolean) {
        if (!open) {
            onClose();
            form.reset();
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Convert from Podorozhnik</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleApply)}>
                        <div className={"flex flex-col gap-4 mb-4"}>
                            <FormField
                                control={form.control}
                                name="plantainNumber"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Podorozhnik Number</FormLabel>
                                        <FormControl>
                                            <Input 
                                                placeholder="9643 3078 XXXX XXXX XXXX XXXX XX"
                                                {...field} 
                                            />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                        </div>
                        <DialogFooter>
                            <Button 
                                type="submit" 
                                disabled={!form.formState.isValid}
                            >
                                Apply
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
