import React, {useEffect, useState} from "react";
import {DefaultDialogProps} from "@/lib/types";
import {getClient, R} from "@/lib/api/client";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import {ENTRANCE_SOUNDS_QUERY_KEY, MEMBER_QUERY_KEY} from "@/lib/cache-tags";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {Play} from "lucide-react";

interface EntranceSoundItem {
    id: string;
    name: string;
}

export function EditEntranceSoundDialog({open, onClose, memberId, currentSoundId}: DefaultDialogProps & {
    memberId: string;
    currentSoundId?: string;
}) {
    const client = getClient();
    const queryClient = useQueryClient();

    const [selectedSoundId, setSelectedSoundId] = useState<string | undefined>(currentSoundId);

    useEffect(() => {
        if (open) {
            setSelectedSoundId(currentSoundId);
        }
    }, [open, currentSoundId]);

    const entranceSounds = useQuery({
        queryFn: async () => {
            const response = await client.GET("/api/entrance-sound", {});
            const data = R(response);
            return (data.data as unknown as { sounds: EntranceSoundItem[] }).sounds;
        },
        queryKey: [ENTRANCE_SOUNDS_QUERY_KEY],
        retry: false,
        enabled: open,
    });

    const playSound = useMutation({
        mutationFn: async (soundId: string) => {
            R(await client.POST("/api/entrance-sound/play", {
                body: {id: soundId}
            }));
        },
    });

    const saveSound = useMutation({
        mutationFn: async (soundId: string | null) => {
            R(await client.PATCH("/api/members/{id}/entrance-sound", {
                params: {path: {id: memberId}},
                body: {id: soundId && soundId !== 'none' ? soundId : ''}
            }));
        },
        onSuccess: async () => {
            onClose();
            await queryClient.refetchQueries({queryKey: [MEMBER_QUERY_KEY, memberId]});
        },
    });

    function onOpenChange(open: boolean) {
        if (!open && !saveSound.isPending) {
            onClose();
        }
    }

    return <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Edit Entrance Sound</DialogTitle>
            </DialogHeader>
            <div className={"flex flex-col gap-4 mb-4"}>
                <div className={"flex flex-row gap-2"}>
                    <Select value={selectedSoundId ?? ""} onValueChange={setSelectedSoundId}
                            disabled={saveSound.isPending}>
                        <SelectTrigger className={"flex-1"}>
                            <SelectValue placeholder="Select entrance sound"/>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectGroup>
                                <SelectItem value={"none"} key={"none"}>
                                    None
                                </SelectItem>
                                {entranceSounds.data?.map(sound =>
                                    <SelectItem value={sound.id} key={sound.id}>
                                        {sound.name}
                                    </SelectItem>
                                )}
                            </SelectGroup>
                        </SelectContent>
                    </Select>
                    <Button
                        variant={"outline"}
                        className={"w-10 p-0 h-10"}
                        disabled={!selectedSoundId || playSound.isPending}
                        onClick={() => selectedSoundId && playSound.mutate(selectedSoundId)}
                    >
                        <Play className={"w-4 h-4"}/>
                    </Button>
                </div>
            </div>
            <DialogFooter>
                <Button
                    disabled={saveSound.isPending}
                    onClick={() => saveSound.mutate(selectedSoundId ?? null)}
                >
                    Save
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>;
}
