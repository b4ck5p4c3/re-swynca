/**
 * Miniature test suite built upon Node.js native test runner,
 * as we don't have a proper testing framework in place yet.
 */

import { convertPlantainPANToUID } from './nfc'
import test from 'node:test'
import assert from 'node:assert/strict'

const testCases = [
  ['9643 3078 3614 0197 3654 3232 49', '0440146A516580'],
  ['9643 3078 3615 4138 7004 9690 00', '04406762FF7180']
]

test('Plantain PAN to UID conversion', () => {
  for (const [pan, expectedUid] of testCases) {
    const uid = convertPlantainPANToUID(pan);
    assert.strictEqual(uid, expectedUid);
  }
})
