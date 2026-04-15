import Decimal from 'decimal.js'
import { ValueTransformer } from 'typeorm'

export class DecimalTransformer implements ValueTransformer {
  from (value?: string): Decimal | null {
    return value ? new Decimal(value) : null
  }

  to (value?: Decimal): null | string {
    return value?.toString()
  }
}
