import test from 'node:test';
import assert from 'node:assert/strict';
import { validateProjectArticle } from '../src/scripts/project-content.js';

test('older image-only projects and complete article entries remain supported', () => {
  assert.doesNotThrow(() => validateProjectArticle(undefined));
  assert.doesNotThrow(() => validateProjectArticle({ title: 'My study', body: ['The first paragraph.', 'The second paragraph.'] }));
  assert.doesNotThrow(() => validateProjectArticle({ title: 'Image-only article', body: [] }));
});

test('invalid article edits report the project and field to fix', () => {
  for (const value of [null, 'text', []]) assert.throws(() => validateProjectArticle(value, 'Design article'), /Design article must be an object/);
  assert.throws(() => validateProjectArticle({ title: '', body: [] }), /title needs nonempty text/);
  for (const body of ['Text', [''], [42], undefined]) assert.throws(() => validateProjectArticle({ title: 'Study', body }), /body must be an array/);
});
