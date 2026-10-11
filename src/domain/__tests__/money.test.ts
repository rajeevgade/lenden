import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatMoney, parseMoney, groupDigits, toMajorString } from '../money';

test('indic grouping', () => {
  assert.equal(groupDigits('100000', true), '1,00,000');
  assert.equal(groupDigits('10000000', true), '1,00,00,000');
  assert.equal(groupDigits('1001', true), '1,001');
  assert.equal(groupDigits('999', true), '999');
});

test('western grouping', () => {
  assert.equal(groupDigits('1234567', false), '1,234,567');
  assert.equal(groupDigits('100', false), '100');
});

test('formatMoney INR', () => {
  assert.equal(formatMoney(100100, 'INR'), '₹1,001');
  assert.equal(formatMoney(210000, 'INR'), '₹2,100');
  assert.equal(formatMoney(10000000, 'INR'), '₹1,00,000');
  assert.equal(formatMoney(100150, 'INR'), '₹1,001.50');
  assert.equal(formatMoney(-50100, 'INR'), '-₹501');
  assert.equal(formatMoney(50100, 'INR', { showPlus: true }), '+₹501');
  assert.equal(formatMoney(0, 'INR'), '₹0');
});

test('formatMoney other currencies', () => {
  assert.equal(formatMoney(123456, 'USD'), '$1,234.56');
  assert.equal(formatMoney(5000, 'JPY'), '¥5,000');
  assert.equal(formatMoney(100, 'XYZ'), 'XYZ 1');
});

test('parseMoney', () => {
  assert.equal(parseMoney('1001', 'INR'), 100100);
  assert.equal(parseMoney('1,001', 'INR'), 100100);
  assert.equal(parseMoney('₹ 2,100', 'INR'), 210000);
  assert.equal(parseMoney('1001.5', 'INR'), 100150);
  assert.equal(parseMoney('1001.567', 'INR'), 100156);
  assert.equal(parseMoney('.5', 'INR'), 50);
  assert.equal(parseMoney('', 'INR'), null);
  assert.equal(parseMoney('abc', 'INR'), null);
  assert.equal(parseMoney('5000', 'JPY'), 5000);
  assert.equal(parseMoney('5000.9', 'JPY'), 5000);
});

test('round trips', () => {
  for (const v of [0, 1, 100, 100100, 100150, 12345678901]) {
    assert.equal(parseMoney(toMajorString(v, 'INR'), 'INR'), v);
  }
  assert.equal(toMajorString(100150, 'INR'), '1001.5');
  assert.equal(toMajorString(100100, 'INR'), '1001');
});
