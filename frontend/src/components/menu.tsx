"use client";

import {Button} from "@/components/ui/button";
import React from "react";
import {usePathname, useRouter} from "next/navigation";

export function MenuEntry({url, children}: { url: string, children: React.ReactNode; }) {
    const router = useRouter();
    const path = usePathname();

    return <Button variant={path == url ? "secondary" : "ghost"}
                   onClick={() => router.push(url)}>{children}</Button>
}

export function Menu({children}: { children: React.ReactNode }) {
    return <div className={"flex flex-row gap-6"}>
        {children}
    </div>;
}