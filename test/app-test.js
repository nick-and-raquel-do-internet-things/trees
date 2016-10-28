/* globals describe, it */
const assert = require('assert');
const lSystem = require('../src/l-system');

describe('L-System', () => {
  describe('algae', () => {
    const rules = {
      'A': 'AB',
      'B': 'A'
    };

    it('rules', () => {
      assert.equal(lSystem('A', rules), 'AB');
      assert.equal(lSystem('AB', rules), 'ABA');
      assert.equal(lSystem('ABA', rules), 'ABAAB');
    });

    it('is fibonacci', () => {
      const fib = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89];

      fib.reduce((acc, input) => {
        assert.equal(acc.length, input);

        return lSystem(acc, rules);
      }, 'A');
    });
  });

  describe('pythagoras tree', () => {
    const rules = {
      '1': '11',
      '0': '1[0]0'
    };

    it('rules', () => {
      const expectedOutput = [
        '0',
        '1[0]0',
        '11[1[0]0]1[0]0',
        '1111[11[1[0]0]1[0]0]11[1[0]0]1[0]0'
      ];

      expectedOutput.reduce((acc, expected) => {
        assert.equal(acc, expected);

        return lSystem(acc, rules);
      }, '0');
    });
  });
});
