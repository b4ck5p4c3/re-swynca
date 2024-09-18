import Decimal from "decimal.js";

export function moneyToDecimal(value: string | number): Decimal {
    return new Decimal(value);
}

export function moneyToNumberFormat(value: Decimal): string {
    return value.toFixed(parseInt(process.env.NEXT_PUBLIC_DECIMAL_PLACES ?? "2"));
}