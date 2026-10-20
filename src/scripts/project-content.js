export function validateProjectArticle(article, location = 'Article') {
  // Older image-only entries still open with their existing title and image.
  if (article === undefined) return;
  if (!article || typeof article !== 'object' || Array.isArray(article)) throw new Error(`${location} must be an object.`);
  if (typeof article.title !== 'string' || !article.title.trim()) throw new Error(`${location}.title needs nonempty text.`);
  if (!Array.isArray(article.body) || article.body.some(paragraph => typeof paragraph !== 'string' || !paragraph.trim())) {
    throw new Error(`${location}.body must be an array of nonempty paragraph strings.`);
  }
}
