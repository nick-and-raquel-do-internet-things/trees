/* globals describe, it */
const assert = require('assert');

function lSystem (input, rules) {
  const chars = input.split('');

  return chars.map(char => rules[char]).join('');
}

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
});
