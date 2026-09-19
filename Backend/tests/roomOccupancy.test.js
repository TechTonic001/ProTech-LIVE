const assert = require('node:assert/strict');
const { normalizeRoomOccupancy, isRoomOccupied, isRoomVacant } = require('../utils/roomOccupancy');

const cases = [
  { input: 0, expected: false, label: 'integer 0 is vacant' },
  { input: 1, expected: true, label: 'integer 1 is occupied' },
  { input: '0', expected: false, label: 'string 0 is vacant' },
  { input: '1', expected: true, label: 'string 1 is occupied' },
  { input: false, expected: false, label: 'false is vacant' },
  { input: true, expected: true, label: 'true is occupied' },
  { input: null, expected: false, label: 'null is vacant' },
];

for (const testCase of cases) {
  assert.equal(normalizeRoomOccupancy(testCase.input), testCase.expected, testCase.label);
  assert.equal(isRoomOccupied(testCase.input), testCase.expected, `${testCase.label} occupancy`);
  assert.equal(isRoomVacant(testCase.input), !testCase.expected, `${testCase.label} vacancy`);
}

console.log(`roomOccupancy tests passed (${cases.length})`);
