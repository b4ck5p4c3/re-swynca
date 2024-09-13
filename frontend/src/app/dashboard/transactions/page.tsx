import {redirect, RedirectType} from "next/navigation";

export default function TransactionsPage() {
    redirect("/dashboard/transactions/member", RedirectType.replace);
}