import type {Metadata} from "next";
import "./globals.css";
import React from "react";
import {Toaster} from "@/components/ui/toaster";
import {AppQueryClientProvider} from "@/components/app-query-client-provider";

export const metadata: Metadata = {
    title: "RE: Swynca",
    description: "B4CKSP4CE member/money management system",
};

export default function RootLayout({children,}: Readonly<{ children: React.ReactNode; }>) {
    return (
        <html lang="en">
        <body>
        <Toaster/>
        <AppQueryClientProvider>
            {children}
        </AppQueryClientProvider>
        </body>
        </html>
    );
}
