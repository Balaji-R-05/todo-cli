import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { shortId, findTodoIndex, normalizeTodo, SHORT_ID_LENGTH, MIN_ID_QUERY_LENGTH } from '../lib.js';

describe('shortId', () => {
    test('truncates to SHORT_ID_LENGTH characters', () => {
        const todo = { id: 'abcdef1234567890' };
        assert.equal(shortId(todo), 'abcdef'.slice(0, SHORT_ID_LENGTH));
        assert.equal(shortId(todo).length, SHORT_ID_LENGTH);
    });

    test('handles ids shorter than SHORT_ID_LENGTH', () => {
        assert.equal(shortId({ id: 'ab' }), 'ab');
    });
});

describe('findTodoIndex', () => {
    const todos = [
        { id: 'aaaaaa1111', text: 'first' },
        { id: 'aaaaaa2222', text: 'second' },
        { id: 'bbbbbb3333', text: 'third' },
    ];

    test('rejects queries shorter than MIN_ID_QUERY_LENGTH', () => {
        const result = findTodoIndex(todos, 'a'.repeat(MIN_ID_QUERY_LENGTH - 1));
        assert.deepEqual(result, { status: 'too-short' });
    });

    test('resolves a unique prefix match', () => {
        const result = findTodoIndex(todos, 'bbbb');
        assert.deepEqual(result, { status: 'ok', index: 2 });
    });

    test('resolves an exact full-id match', () => {
        const result = findTodoIndex(todos, 'aaaaaa2222');
        assert.deepEqual(result, { status: 'ok', index: 1 });
    });

    test('is case-insensitive', () => {
        const result = findTodoIndex(todos, 'BBBB');
        assert.deepEqual(result, { status: 'ok', index: 2 });
    });

    test('trims surrounding whitespace', () => {
        const result = findTodoIndex(todos, '  bbbb  ');
        assert.deepEqual(result, { status: 'ok', index: 2 });
    });

    test('reports no match', () => {
        const result = findTodoIndex(todos, 'zzzz');
        assert.deepEqual(result, { status: 'not-found' });
    });

    test('reports an ambiguous match with the count', () => {
        const result = findTodoIndex(todos, 'aaaa');
        assert.deepEqual(result, { status: 'ambiguous', count: 2 });
    });

    test('handles an empty todo list', () => {
        const result = findTodoIndex([], 'aaaa');
        assert.deepEqual(result, { status: 'not-found' });
    });
});

describe('normalizeTodo', () => {
    test('backfills both timestamps on a todo with neither', () => {
        const todo = { id: 'a', text: 'old', completed: false };
        const result = normalizeTodo(todo, '2026-01-01T00:00:00.000Z');
        assert.equal(result.createdAt, '2026-01-01T00:00:00.000Z');
        assert.equal(result.updatedAt, '2026-01-01T00:00:00.000Z');
    });

    test('leaves existing timestamps untouched', () => {
        const todo = {
            id: 'a',
            createdAt: '2025-01-01T00:00:00.000Z',
            updatedAt: '2025-06-01T00:00:00.000Z'
        };
        const result = normalizeTodo(todo, '2026-01-01T00:00:00.000Z');
        assert.equal(result.createdAt, '2025-01-01T00:00:00.000Z');
        assert.equal(result.updatedAt, '2025-06-01T00:00:00.000Z');
    });

    test('falls back updatedAt to an existing createdAt rather than the fallback', () => {
        const todo = { id: 'a', createdAt: '2025-01-01T00:00:00.000Z' };
        const result = normalizeTodo(todo, '2026-01-01T00:00:00.000Z');
        assert.equal(result.createdAt, '2025-01-01T00:00:00.000Z');
        assert.equal(result.updatedAt, '2025-01-01T00:00:00.000Z');
    });

    test('does not mutate the original todo', () => {
        const todo = { id: 'a' };
        normalizeTodo(todo, '2026-01-01T00:00:00.000Z');
        assert.equal(todo.createdAt, undefined);
    });
});
