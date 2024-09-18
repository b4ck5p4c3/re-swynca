"use client";

import {useMemo} from "react";
import {moneyToDecimal, moneyToNumberFormat} from "@/lib/money";
import Decimal from "decimal.js";
import {cn} from "@/lib/utils";

export function Money({amount, className, negate}: {
    amount: Decimal | string | number,
    className?: string,
    negate?: boolean
}) {
    const currencySymbol = useMemo(
        () =>
            new Intl.NumberFormat(process.env.NEXT_PUBLIC_LOCALE, {
                style: "currency",
                currency: process.env.NEXT_PUBLIC_CURRENCY,
            }).formatToParts(0)[4].value,
        []
    );

    const realAmount = typeof amount === "string" || typeof amount === "number"
        ? moneyToDecimal(amount) : amount;

    const displayedAmount = negate ? realAmount.negated() : realAmount;

    return <span className={displayedAmount.isNegative() ? cn(className, "text-red-600") : className}>
        {moneyToNumberFormat(displayedAmount)} {currencySymbol}</span>
}