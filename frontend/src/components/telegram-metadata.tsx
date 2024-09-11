import React, {useState} from "react";
import {getClient, R} from "@/lib/api/client";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {MEMBER_QUERY_KEY} from "@/lib/cache-tags";
import {Button} from "@/components/ui/button";
import {Pencil1Icon, PlusIcon, TrashIcon} from "@radix-ui/react-icons";
import {UpdateTelegramMetadataDialog} from "@/components/dialogs/update-telegram-metadata";
import {MemberDTO} from "@/lib/types";

export function TelegramMetadata({metadata, member}: {
    metadata?: { telegramId: string; telegramName: string },
    member: MemberDTO
}) {
    const [updateTelegramMetadataDialogOpened, setUpdateTelegramMetadataDialogOpened] = useState(false);

    const client = getClient();

    const queryClient = useQueryClient();

    const deleteTelegramMetadata = useMutation({
        mutationFn: async (memberId: string) => {
            R(await client.DELETE("/api/members/{id}/telegram", {
                params: {
                    path: {
                        id: memberId
                    }
                }
            }));
        },
        onSuccess: async (_: void, memberId: string) => {
            await queryClient.refetchQueries({queryKey: [`${MEMBER_QUERY_KEY}-${memberId}`]});
        }
    });

    return <>
        {metadata ? <div className={"flex flex-row gap-2"}>
            <a href={`tg://user?id=${metadata.telegramId}`} className={"underline leading-8"}>
                {metadata.telegramName} ({metadata.telegramId})
            </a>
            <Button className={"w-8 p-0 h-8"} onClick={() => setUpdateTelegramMetadataDialogOpened(true)}>
                <Pencil1Icon/></Button>
            <Button variant={"destructive"} className={"w-8 p-0 h-8"} onClick={() =>
                deleteTelegramMetadata.mutate(member.id)}><TrashIcon/></Button>
        </div> : <div className={"flex flex-row gap-2"}>
            <span className={"leading-8"}>Not linked</span>
            <Button className={"w-8 p-0 h-8"} onClick={() => setUpdateTelegramMetadataDialogOpened(true)}>
                <PlusIcon/></Button>
        </div>}
        <UpdateTelegramMetadataDialog open={updateTelegramMetadataDialogOpened}
                                      onClose={() => setUpdateTelegramMetadataDialogOpened(false)}
                                      member={member}/>
    </>
}
