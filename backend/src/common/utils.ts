import { FindOptionsOrder } from 'typeorm'

export type EntityColumns<T> = {
  [P in keyof T]?: boolean;
}

export class EmptyResponse {}

export function getCountAndOffset (count: string | undefined, offset: string | undefined, maxCount: number):
[number, number] {
  const realCount = parseIntOrDefault(count, maxCount)
  const realOffset = parseIntOrDefault(offset, 0)
  return [Math.min(maxCount, Math.max(0, realCount)), Math.max(realOffset, 0)]
}

export function getOrderObject<T> (rawOrderBy: string | undefined, rawOrderDirection: string | undefined,
  allowedColumns: EntityColumns<T>): FindOptionsOrder<T> {
  if (!allowedColumns[rawOrderBy]) {
    return {}
  }

  return {
    [rawOrderBy]: rawOrderDirection === 'desc' ? 'desc' : 'asc'
  } as FindOptionsOrder<T>
}

export function parseIntOrDefault (value: string | undefined, defaultValue: number): number {
  if (!value) {
    return defaultValue
  }
  try {
    return Number.parseInt(value, 10)
  } catch {
    return defaultValue
  }
}
