import {ValueTransformer} from "typeorm";
import Decimal from "decimal.js";

export class DecimalTransformer implements ValueTransformer {
    to(value?: Decimal): string | null {
        return value?.toString();
    }

    from(value?: string): Decimal | null {
        return value ? new Decimal(value) : null;
    }
}