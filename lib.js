// Pure, dependency-free helpers shared by the CLI and its tests.
// No file I/O or console output here — that stays in todo.js.

export const SHORT_ID_LENGTH = 6;
export const MIN_ID_QUERY_LENGTH = 4;

export const shortId = (todo) => String(todo.id).slice(0, SHORT_ID_LENGTH);

// Resolves a short ID (or any unique prefix of the full ID) to a list index.
// Returns a discriminated result instead of printing, so the matching logic
// can be unit tested without capturing console output.
export const findTodoIndex = (todos, query) => {
    const q = String(query).trim().toLowerCase();
    if (q.length < MIN_ID_QUERY_LENGTH) {
        return { status: 'too-short' };
    }

    const matches = todos
        .map((todo, index) => index)
        .filter((index) => String(todos[index].id).toLowerCase().startsWith(q));

    if (matches.length === 0) {
        return { status: 'not-found' };
    }
    if (matches.length > 1) {
        return { status: 'ambiguous', count: matches.length };
    }
    return { status: 'ok', index: matches[0] };
};
