import { readFileSync } from 'node:fs'
import { v5 } from 'uuid'

const lines = readFileSync('input.csv', 'utf8').split('\n').map(l => l.trim()).filter(l => l.length)

const namespace = '0d81db9b-449f-4eae-84ec-b4825e60ffb8'

const sentences = [
  'INSERT INTO "entrance_sound" ("id", "key", "name") VALUES',
]

for (const line of lines) {
  const [key, name] = line.split(',').map(s => s.trim())
  const id = v5(key, namespace)
  sentences.push(`('${id}', '${key}', '${name}')`)
}

sentences[sentences.length - 1] += ';'

console.log(sentences.join(',\n'))
