'use strict';

// Pure functions shared by the UI and verification scripts.
window.TranslationCore = {
  normalize(text) {
    return text.normalize('NFKC').toLowerCase().replace(/[\p{P}\p{Z}\s]/gu, '');
  },

  chunks(text, mode) {
    const words = text.trim().split(/\s+/);
    if (mode === 'word') return words;
    const chunks = [];
    let phrase = [];
    const startsPhrase = /^(and|or|but|in|of|to|with|for|by|from|as|at|that|which)$/i;
    for (const word of words) {
      if (phrase.length >= 3 && (startsPhrase.test(word) || phrase.length >= 6)) {
        chunks.push(phrase.join(' '));
        phrase = [];
      }
      phrase.push(word);
      if (/[,.!?;:]$/.test(word)) {
        chunks.push(phrase.join(' '));
        phrase = [];
      }
    }
    if (phrase.length) chunks.push(phrase.join(' '));
    return chunks;
  },

  shuffle(length) {
    const order = Array.from({length}, (_, i) => i);
    for (let i = length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    if (length > 1 && order.every((value, i) => value === i)) order.push(order.shift());
    return order;
  },

  // Longest common subsequence preserves repetitions and highlights word-order differences.
  diff(actual, expected) {
    const left = actual.trim().split(/\s+/).slice(0, 600);
    const right = expected.trim().split(/\s+/);
    const table = Array.from({length:left.length + 1}, () => new Uint16Array(right.length + 1));
    const normalize = this.normalize;
    for (let i = left.length - 1; i >= 0; i--) {
      for (let j = right.length - 1; j >= 0; j--) {
        table[i][j] = normalize(left[i]) === normalize(right[j])
          ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
      }
    }
    const matchedLeft = new Set();
    const matchedRight = new Set();
    let i = 0;
    let j = 0;
    while (i < left.length && j < right.length) {
      if (normalize(left[i]) === normalize(right[j])) {
        matchedLeft.add(i++);
        matchedRight.add(j++);
      } else if (table[i + 1][j] >= table[i][j + 1]) i++;
      else j++;
    }
    return {left, right, matchedLeft, matchedRight};
  }
};
