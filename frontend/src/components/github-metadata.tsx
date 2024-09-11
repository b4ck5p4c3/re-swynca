import React, {useState} from "react";
import {getClient, R} from "@/lib/api/client";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {MEMBER_QUERY_KEY} from "@/lib/cache-tags";
import {Button} from "@/components/ui/button";
import {Pencil1Icon, PlusIcon, TrashIcon} from "@radix-ui/react-icons";
import {UpdateGitHubMetadataDialog} from "@/components/dialogs/update-github-metadata";
import {MemberDTO} from "@/lib/types";

export function GitHubMetadata({metadata, member}: {
    metadata?: { githubId: string; githubUsername: string },
    member: MemberDTO
}) {
    const [updateGitHubMetadataDialogOpened, setUpdateGitHubMetadataDialogOpened] = useState(false);

    const client = getClient();

    const queryClient = useQueryClient();

    const deleteGitHubMetadata = useMutation({
        mutationFn: async (memberId: string) => {
            R(await client.DELETE("/api/members/{id}/github", {
                params: {
                    path: {
                        id: member.id
                    }
                }
            }));
        },
        onSuccess: async (_: void, memberId: string) => {
            await queryClient.refetchQueries({queryKey: [`${MEMBER_QUERY_KEY}-${member.id}`]});
        }
    });

    return <>
        {metadata ? <div className={"flex flex-row gap-2"}>
            <a href={`https://github.com/${metadata.githubUsername}`} className={"underline leading-8"}>
                {metadata.githubUsername} ({metadata.githubId})
            </a>
            <Button className={"w-8 p-0 h-8"}
                    onClick={() => setUpdateGitHubMetadataDialogOpened(true)}><Pencil1Icon/></Button>
            <Button variant={"destructive"} className={"w-8 p-0 h-8"}
                    onClick={() => deleteGitHubMetadata.mutate(member.id)}><TrashIcon/></Button>
        </div> : <div className={"flex flex-row gap-2"}>
            <span className={"leading-8"}>Not linked</span>
            <Button className={"w-8 p-0 h-8"}
                    onClick={() => setUpdateGitHubMetadataDialogOpened(true)}><PlusIcon/></Button>
        </div>}
        <UpdateGitHubMetadataDialog open={updateGitHubMetadataDialogOpened}
                                    onClose={() => setUpdateGitHubMetadataDialogOpened(false)} member={member}/>
    </>
}