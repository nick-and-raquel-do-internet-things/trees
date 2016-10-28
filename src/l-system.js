module.exports = function lSystem (input, rules) {
  const chars = input.split('');

  return chars.map(char => rules[char] || char).join('');
}

