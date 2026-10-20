export function layoutCareerStickers(card) {
  if (card.stickers.length > 4) throw new Error(`Career card "${card.title}" can have at most four PNG stickers.`);

  // A content-based seed keeps positions fixed across reloads and rebuilds.
  let seed = 2166136261;
  for (const character of `${card.title}|${card.image?.src ?? ''}`) {
    seed = Math.imul(seed ^ character.charCodeAt(0), 16777619) >>> 0;
  }
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const left = random() < .5;
  const top = random() < .5;
  // The first two stickers use opposite corners; four fill separate corners.
  const corners = [[left, top], [!left, !top], [!left, top], [left, !top]];
  return card.stickers.map((sticker, index) => {
    const [onLeft, onTop] = corners[index];
    const x = Number(((onLeft ? 4 : 90) + random() * 6).toFixed(1));
    const y = Number(((onTop ? 12 : 76) + random() * 12).toFixed(1));
    return { ...sticker, x: sticker.x ?? x, y: sticker.y ?? y };
  });
}
