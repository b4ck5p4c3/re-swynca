"use client";

import {Button} from "@/components/ui/button";
import {useRouter} from "next/navigation";
import Image from "next/image";
import logto from "@/static/images/logto.svg";
import logo from "@/static/images/logo.svg";

export default function AuthPage() {
    const router = useRouter();

    return (<div className={"w-screen h-screen flex items-center justify-center flex-col gap-20"}>
        <Image src={logo} alt={"logo"} width={160} height={160}/>
        <Button onClick={() => {
            router.push(process.env.NEXT_PUBLIC_AUTH_URL ?? "/");
        }} className={"flex gap-2"}><Image src={logto} alt={"logto"} width={24} height={24}/>
            <span>Authorize</span></Button>
        <div/>
        <div/>
    </div>);
}