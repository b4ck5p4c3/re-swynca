import React, {useState} from "react";
import {getClient, R} from "@/lib/api/client";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {MEMBER_QUERY_KEY} from "@/lib/cache-tags";
import {Button} from "@/components/ui/button";
import {UpdateGitHubMetadataDialog} from "@/components/dialogs/update-github-metadata";
import {MemberDTO} from "@/lib/types";
import {Pencil, Plus, Trash} from "lucide-react";

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
                        id: memberId
                    }
                }
            }));
        },
        onSuccess: async (_: void, memberId: string) => {
            await queryClient.refetchQueries({queryKey: [MEMBER_QUERY_KEY, memberId]});
        }
    });

    return <>
        {metadata ? <div className={"flex xs:flex-row flex-col gap-2"}>
            <a href={`https://github.com/${metadata.githubUsername}`} className={"underline leading-8"}>
                {metadata.githubUsername} ({metadata.githubId})
            </a>
            <div className={"flex flex-row gap-2"}>
                <Button className={"w-8 p-0 h-8"}
                        disabled={deleteGitHubMetadata.isPending}
                        onClick={() => setUpdateGitHubMetadataDialogOpened(true)}><Pencil
                    className={"w-4 h-4"}/></Button>
                <Button variant={"destructive"} className={"w-8 p-0 h-8"}
                        disabled={deleteGitHubMetadata.isPending}
                        onClick={() => deleteGitHubMetadata.mutate(member.id)}><Trash className={"w-4 h-4"}/></Button>
            </div>
        </div> : <div className={"flex flex-row gap-2"}>
            <span className={"leading-8"}>Not linked</span>
            <Button className={"w-8 p-0 h-8"}
                    onClick={() => setUpdateGitHubMetadataDialogOpened(true)}><Plus className={"w-6 h-6"}/></Button>
        </div>}
        <UpdateGitHubMetadataDialog open={updateGitHubMetadataDialogOpened}
                                    onClose={() => setUpdateGitHubMetadataDialogOpened(false)} member={member}/>
    </>
}