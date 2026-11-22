/**
 * AUlaf Matching Engine - Test Suite
 * Uses Node.js built-in test runner (node:test + assert)
 *
 * Run: node --test src/lib/matching/engine.test.js
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  normalizeText,
  tokenize,
  tokenCounts,
  buildIdfMap,
  cosineSimilarity,
  tokenF1,
  textSimilarity,
  textScore,
  canonicalCategory,
  attributeScore,
  parseDateStrict,
  dateScore,
  normalizeWeights,
  isExplicitlyIneligible,
  sanitizeReport,
  scoreReportPair,
  matchReport,
  findMatchingReports,
  createMatchingEngine
} from './engine.js';

// ─── Helper ───────────────────────────────────────────────────────────────────

function makeReport(overrides) {
  return {
    id: overrides.id || 'test-id',
    item_name: '',
    description: '',
    category: '',
    brand: '',
    color: '',
    location: '',
    date: '',
    status: 'Active',
    image: null,
    type: 'lost',
    ...overrides
  };
}

function runPairTest(lostName, foundName, lostCat, foundCat, lostBrand, foundBrand,
                     lostColor, foundColor, lostDate, foundDate, minScore) {
  const lost  = makeReport({ id: 'l1', item_name: lostName,  category: lostCat,  brand: lostBrand,  color: lostColor,  date: lostDate,  type: 'lost'  });
  const found = makeReport({ id: 'f1', item_name: foundName, category: foundCat, brand: foundBrand, color: foundColor, date: foundDate, type: 'found' });
  const idfMap = buildIdfMap([lost, found]);
  const score  = scoreReportPair(lost, found, idfMap, null);
  return { score, minScore };
}

// ─── Benchmark Pairs (Table 4.3) ──────────────────────────────────────────────

describe('Benchmark pairs', () => {

  test('HP Laptop vs HP notebook computer ≥ 95', () => {
    const { score, minScore } = runPairTest(
      'HP Laptop',              'HP notebook computer',
      'Electronics',            'Electronics',
      'HP',                     'HP',
      'Silver',                 'Silver',
      '2026-11-01',             '2026-11-01',
      95
    );
    assert.ok(score >= minScore, `Expected ≥${minScore}, got ${score}`);
  });

  test('Casio Watch vs Silver Casio wristwatch ≥ 88', () => {
    const { score, minScore } = runPairTest(
      'Casio Watch',            'Silver Casio wristwatch',
      'Electronics',            'Electronics',
      'Casio',                  'Casio',
      'Silver',                 'Silver',
      '2026-11-02',             '2026-11-03',
      88
    );
    assert.ok(score >= minScore, `Expected ≥${minScore}, got ${score}`);
  });

  test('Blue Backpack vs Blue college bag ≥ 85', () => {
    const { score, minScore } = runPairTest(
      'Blue Backpack',          'Blue college bag',
      'Bags & Wallets',         'Bags & Wallets',
      'Wildcraft',              'Wildcraft',
      'Blue',                   'Blue',
      '2026-11-03',             '2026-11-04',
      85
    );
    assert.ok(score >= minScore, `Expected ≥${minScore}, got ${score}`);
  });

  test('Boat Airdopes 141 vs Black boAt earbuds ≥ 80', () => {
    const { score, minScore } = runPairTest(
      'Boat Airdopes 141',      'Black boAt earbuds',
      'Electronics',            'Electronics',
      'boAt',                   'boAt',
      'Black',                  'Black',
      '2026-11-04',             '2026-11-05',
      80
    );
    assert.ok(score >= minScore, `Expected ≥${minScore}, got ${score}`);
  });

  test('College ID Card vs Student identity card ≥ 80', () => {
    const { score, minScore } = runPairTest(
      'College ID Card',        'Student identity card',
      'Keys & Identity',        'Keys & Identity',
      '',                       '',
      'Green',                  'Green',
      '2026-11-05',             '2026-11-06',
      80
    );
    assert.ok(score >= minScore, `Expected ≥${minScore}, got ${score}`);
  });

  test('Black Wallet vs Leather wallet ≥ 65', () => {
    const { score, minScore } = runPairTest(
      'Black Wallet',           'Leather wallet',
      'Bags & Wallets',         'Bags & Wallets',
      '',                       '',
      'Black',                  'Black',
      '2026-11-06',             '2026-11-07',
      65
    );
    assert.ok(score >= minScore, `Expected ≥${minScore}, got ${score}`);
  });

  test('Scientific Calculator vs Casio scientific calculator ≥ 65', () => {
    const { score, minScore } = runPairTest(
      'Scientific Calculator',  'Casio scientific calculator',
      'Academic Tools',         'Academic Tools',
      '',                       'Casio',
      'Black',                  'Black',
      '2026-11-07',             '2026-11-08',
      65
    );
    assert.ok(score >= minScore, `Expected ≥${minScore}, got ${score}`);
  });

  test('iPhone 14 vs Apple iPhone ≥ 65', () => {
    const { score, minScore } = runPairTest(
      'iPhone 14',              'Apple iPhone',
      'Electronics',            'Electronics',
      'Apple',                  'Apple',
      'Black',                  'Black',
      '2026-11-08',             '2026-11-09',
      65
    );
    assert.ok(score >= minScore, `Expected ≥${minScore}, got ${score}`);
  });

  test('Running Shoes vs Running shoes ≥ 65', () => {
    const { score, minScore } = runPairTest(
      'Running Shoes',          'Running shoes',
      'Clothing & Apparel',     'Clothing & Apparel',
      'Adidas',                 'Adidas',
      'Red',                    'Red',
      '2026-11-09',             '2026-11-10',
      65
    );
    assert.ok(score >= minScore, `Expected ≥${minScore}, got ${score}`);
  });

});

// ─── Unit Tests ───────────────────────────────────────────────────────────────

describe('normalizeText', () => {
  test('removes boilerplate words', () => {
    const r = normalizeText('I lost my item near the library');
    assert.ok(!r.includes('lost'), 'should remove "lost"');
    assert.ok(!r.includes('item'), 'should remove "item"');
  });

  test('applies phrase aliases', () => {
    assert.ok(normalizeText('notebook computer').includes('laptop'), 'notebook computer → laptop');
    assert.ok(normalizeText('running shoes').includes('footwear'), 'running shoes → footwear');
    assert.ok(normalizeText('wristwatch').includes('watch'), 'wristwatch → watch');
  });

  test('lowercases and removes non-alphanumeric', () => {
    const r = normalizeText('HP Laptop! #2');
    assert.ok(r === r.toLowerCase(), 'should be lowercase');
    assert.ok(!/[!#]/.test(r), 'should remove special chars');
  });

  test('returns empty string for empty input', () => {
    assert.equal(normalizeText(''), '');
    assert.equal(normalizeText(null), '');
  });
});

describe('tokenize', () => {
  test('filters stop words', () => {
    const tokens = tokenize('the laptop is in the bag');
    assert.ok(!tokens.includes('the'), 'should remove "the"');
    assert.ok(!tokens.includes('is'), 'should remove "is"');
    assert.ok(!tokens.includes('in'), 'should remove "in"');
  });

  test('returns array', () => {
    const tokens = tokenize('HP Laptop Silver');
    assert.ok(Array.isArray(tokens));
    assert.ok(tokens.length > 0);
  });

  test('empty input returns empty array', () => {
    assert.deepEqual(tokenize(''), []);
    assert.deepEqual(tokenize(null), []);
  });
});

describe('tokenF1', () => {
  test('identical token sets → 1', () => {
    assert.equal(tokenF1(['a','b','c'], ['a','b','c']), 1);
  });

  test('no overlap → 0', () => {
    assert.equal(tokenF1(['a','b'], ['c','d']), 0);
  });

  test('partial overlap', () => {
    // A={a,b}, B={b,c} → intersection=1, |A|+|B|=4 → 2/4=0.5
    const f = tokenF1(['a','b'], ['b','c']);
    assert.ok(Math.abs(f - 0.5) < 0.001, `expected ~0.5, got ${f}`);
  });

  test('empty arrays → 0', () => {
    assert.equal(tokenF1([], ['a','b']), 0);
    assert.equal(tokenF1(['a'], []), 0);
  });
});

describe('dateScore', () => {
  test('same date → 100', () => {
    assert.equal(dateScore('2026-11-01', '2026-11-01'), 100);
  });

  test('30 days apart → 0', () => {
    assert.equal(dateScore('2026-11-01', '2026-12-01'), 0);
  });

  test('15 days apart → 50', () => {
    const s = dateScore('2026-11-01', '2026-11-16');
    assert.ok(Math.abs(s - 50) < 1, `expected ~50, got ${s}`);
  });

  test('missing date → 0', () => {
    assert.equal(dateScore('', '2026-11-01'), 0);
    assert.equal(dateScore(null, null), 0);
  });

  test('invalid date → 0', () => {
    assert.equal(dateScore('not-a-date', '2026-11-01'), 0);
  });
});

describe('isExplicitlyIneligible', () => {
  test('Active → false', () => {
    assert.equal(isExplicitlyIneligible({ status: 'Active' }), false);
  });

  test('Closed → true', () => {
    assert.equal(isExplicitlyIneligible({ status: 'Closed' }), true);
  });

  test('case-insensitive RESOLVED → true', () => {
    assert.equal(isExplicitlyIneligible({ status: 'RESOLVED' }), true);
  });

  test('all ineligible statuses', () => {
    const statuses = ['Closed','Recovered','Resolved','Deleted','Inactive',
                      'Cancelled','Archived','Hidden','Blocked','Removed'];
    for (const s of statuses) {
      assert.equal(isExplicitlyIneligible({ status: s }), true, `${s} should be ineligible`);
    }
  });

  test('null/missing report → false', () => {
    assert.equal(isExplicitlyIneligible(null), false);
    assert.equal(isExplicitlyIneligible({}), false);
  });
});

describe('sanitizeReport', () => {
  test('returns only allowed fields', () => {
    const report = {
      id: '123', item_name: 'Laptop', category: 'Electronics',
      brand: 'HP', color: 'Silver', location: 'Library',
      date: '2026-11-01', status: 'Active', image: null,
      type: 'lost', score: 95, matchStrength: 'strong',
      description: 'Should not appear', password: 'secret',
      reporter_email: 'private@test.com'
    };
    const sanitized = sanitizeReport(report);
    assert.ok(!('description' in sanitized), 'description should be excluded');
    assert.ok(!('password' in sanitized), 'password should be excluded');
    assert.ok(!('reporter_email' in sanitized), 'reporter_email should be excluded');
    assert.equal(sanitized.id, '123');
    assert.equal(sanitized.item_name, 'Laptop');
    assert.equal(sanitized.score, 95);
  });

  test('null input → empty object', () => {
    assert.deepEqual(sanitizeReport(null), {});
  });
});

describe('normalizeWeights', () => {
  test('valid weights returned as-is', () => {
    const w = { text: 0.45, category: 0.20, date: 0.15, brand: 0.10, color: 0.10 };
    const result = normalizeWeights(w);
    assert.equal(result.text, 0.45);
  });

  test('invalid sum returns defaults', () => {
    const w = { text: 0.5, category: 0.5, date: 0.5, brand: 0.5, color: 0.5 };
    const result = normalizeWeights(w);
    assert.equal(result.text, 0.45);
  });

  test('null returns defaults', () => {
    const result = normalizeWeights(null);
    assert.equal(result.text, 0.45);
    assert.equal(result.category, 0.20);
  });
});

describe('createMatchingEngine', () => {
  test('returns engine with 3 methods', () => {
    const engine = createMatchingEngine();
    assert.ok(typeof engine.scoreReportPair === 'function');
    assert.ok(typeof engine.matchReport === 'function');
    assert.ok(typeof engine.findMatchingReports === 'function');
  });

  test('engine.scoreReportPair works', () => {
    const engine = createMatchingEngine();
    const lost  = makeReport({ id: 'l1', item_name: 'HP Laptop', category: 'Electronics', brand: 'HP', color: 'Silver', date: '2026-11-01' });
    const found = makeReport({ id: 'f1', item_name: 'HP notebook computer', category: 'Electronics', brand: 'HP', color: 'Silver', date: '2026-11-01' });
    const idfMap = buildIdfMap([lost, found]);
    const score = engine.scoreReportPair(lost, found, idfMap);
    assert.ok(score >= 90, `Expected ≥90, got ${score}`);
  });
});

describe('findMatchingReports', () => {
  test('returns structured results', () => {
    const lost  = [makeReport({ id: 'l1', item_name: 'HP Laptop', category: 'Electronics', brand: 'HP', color: 'Silver', date: '2026-11-01', type: 'lost' })];
    const found = [makeReport({ id: 'f1', item_name: 'HP notebook computer', category: 'Electronics', brand: 'HP', color: 'Silver', date: '2026-11-01', type: 'found' })];
    const result = findMatchingReports(lost, found);
    assert.ok('lostMatches' in result);
    assert.ok('foundMatches' in result);
    assert.ok('pairs' in result);
    assert.ok(result.pairs.length > 0, 'Should find at least one pair');
    assert.ok(result.pairs[0].score >= 65, `Pair score ${result.pairs[0].score} should be ≥ 65`);
  });

  test('ineligible candidates are filtered', () => {
    const lost    = [makeReport({ id: 'l1', item_name: 'Laptop', category: 'Electronics', date: '2026-11-01', type: 'lost' })];
    const found   = [makeReport({ id: 'f1', item_name: 'Laptop', category: 'Electronics', date: '2026-11-01', type: 'found', status: 'Closed' })];
    const result  = findMatchingReports(lost, found);
    assert.equal(result.pairs.length, 0, 'Closed found report should be filtered out');
  });
});
