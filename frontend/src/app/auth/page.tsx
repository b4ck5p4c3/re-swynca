"use client";

import {Loader2} from "lucide-react";
import {Button} from "@/components/ui/button";
import {useRouter} from "next/navigation";
import Image from "next/image";

export default function Auth() {
    const router = useRouter();

    return (<div className={"w-screen h-screen flex items-center justify-center"}>
        <Button onClick={() => {
            router.push(process.env.NEXT_PUBLIC_AUTH_URL ?? "/");
        }} className={"flex gap-2"}><Image src={"https://avatars.githubusercontent.com/u/84981374"} alt={"logto"} width={24} height={24}/>
            <span>Authorize</span></Button>
    </div>);
}