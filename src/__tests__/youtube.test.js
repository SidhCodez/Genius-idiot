// Unit tests for the focus-music YouTube link parser.
import { describe, expect, it } from 'vitest';
import { parseYouTubeUrl, youtubeThumbnail } from '../lib/youtube';

const ID = 'dQw4w9WgXcQ';

describe('parseYouTubeUrl', () => {
  it.each([
    `https://www.youtube.com/watch?v=${ID}`,
    `https://youtube.com/watch?v=${ID}&t=42s`,
    `http://m.youtube.com/watch?v=${ID}`,
    `https://music.youtube.com/watch?v=${ID}&list=RDAMVM`,
    `https://youtu.be/${ID}`,
    `https://youtu.be/${ID}?si=tracking`,
    `https://www.youtube.com/shorts/${ID}`,
    `https://www.youtube.com/live/${ID}`,
    `https://www.youtube.com/embed/${ID}`,
    `youtu.be/${ID}`,
    `  ${ID}  `,
  ])('accepts %s', (input) => {
    expect(parseYouTubeUrl(input)).toEqual({
      videoId: ID,
      watchUrl: `https://www.youtube.com/watch?v=${ID}`,
    });
  });

  it.each([
    '',
    '   ',
    'not a link',
    'https://example.com/watch?v=dQw4w9WgXcQ',
    'https://www.youtube.com/watch?v=too-short',
    'https://www.youtube.com/@somechannel',
    'https://www.youtube.com/playlist?list=PL1234567890',
    `https://youtu.be/${ID}extra`,
  ])('rejects %s', (input) => {
    expect(parseYouTubeUrl(input)).toBeNull();
  });

  it('builds a thumbnail URL', () => {
    expect(youtubeThumbnail(ID)).toBe(`https://i.ytimg.com/vi/${ID}/mqdefault.jpg`);
  });
});
