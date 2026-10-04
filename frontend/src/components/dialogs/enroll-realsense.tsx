import React, { useEffect, useState } from "react";
import {DefaultDialogProps} from "@/lib/types";
import {getClient, R} from "@/lib/api/client";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {MEMBER_REALSENSE_KEY} from "@/lib/cache-tags";
import {Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle} from "@/components/ui/dialog";
import {Button} from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function EnrollRealSenseDialog({open, onClose, memberId}: DefaultDialogProps & {
    memberId: string;
}) {
    const client = getClient();
    const queryClient = useQueryClient();
    const [enrollmentStatus, setEnrollmentStatus] = useState<string | null>(null)

    const enroll = useMutation({
        mutationFn: async () => {
            const result = R(await client.POST("/api/members/{id}/realsense", {
                params: {path: {id: memberId}}
            }));

            if (result.data!.success) {
              onClose()
            } else {
              setEnrollmentStatus(result.data!.status)
            }
        },
        onSuccess: async () => {
            await queryClient.refetchQueries({queryKey: [MEMBER_REALSENSE_KEY, memberId]});
        },
    });

    useEffect(() => {
        if (open) {
            setEnrollmentStatus(null);
        }
    }, [open]);

    function onOpenChange(open: boolean) {
        if (!open && !enroll.isPending) {
            onClose();
        }
    }

    return <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>RealSense Enrollment</DialogTitle>
            </DialogHeader>
            <div className={"flex items-center justify-center"}>
              {enroll.isPending ? <Loader2 className={"animate-spin h-32 w-32"}></Loader2> : enrollmentStatus ? <div>Enrollment failed: {enrollmentStatus}</div> : 
              <div>Press &quot;Enroll&quot; to enroll</div>}
            </div>
            <DialogFooter>
                <Button
                    disabled={enroll.isPending}
                    onClick={() => enroll.mutate()}
                >
                    Enroll
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>;
}
