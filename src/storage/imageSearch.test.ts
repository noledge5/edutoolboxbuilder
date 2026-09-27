import { describe, expect, it } from 'vitest';
import { commonsFull, commonsResults, creditOf, licenseName, openverseResults, plainText } from './imageSearch';

const openverse = {
  result_count: 240,
  page_count: 12,
  results: [
    {
      id: '7992f788',
      title: 'A cute Dog',
      url: 'https://live.staticflickr.com/8116/8606654389_e56c706e2c_b.jpg',
      thumbnail: 'https://api.openverse.org/v1/images/7992f788/thumb/',
      creator: 'Chen Vision',
      license: 'by-nc',
      license_version: '2.0',
      foreign_landing_url: 'https://www.flickr.com/photos/48453366@N08/8606654389',
      provider: 'flickr',
      source: 'flickr',
      width: 1024,
      height: 768,
    },
    { id: 'abc', title: '', creator: '', license: 'cc0', source: 'wikimedia', width: 800, height: 600 },
  ],
};

const commons = {
  continue: { gsroffset: 20, continue: 'gsroffset||' },
  query: {
    pages: [
      {
        pageid: 2,
        title: 'File:Map_of_the_United_Kingdom.svg',
        index: 2,
        imageinfo: [
          {
            thumburl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Map_of_the_United_Kingdom.svg/330px-Map_of_the_United_Kingdom.svg.png',
            url: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Map_of_the_United_Kingdom.svg',
            descriptionurl: 'https://commons.wikimedia.org/wiki/File:Map_of_the_United_Kingdom.svg',
            width: 512,
            height: 800,
            mime: 'image/svg+xml',
            extmetadata: {
              LicenseShortName: { value: 'CC BY-SA 3.0' },
              Artist: { value: '<a href="//commons.wikimedia.org/wiki/User:Jane">Jane Doe</a>' },
              AttributionRequired: { value: 'true' },
            },
          },
        ],
      },
      {
        pageid: 1,
        title: 'File:Dog_on_grass.jpg',
        index: 1,
        imageinfo: [
          {
            thumburl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Dog_on_grass.jpg/330px-Dog_on_grass.jpg',
            url: 'https://upload.wikimedia.org/wikipedia/commons/1/12/Dog_on_grass.jpg',
            descriptionurl: 'https://commons.wikimedia.org/wiki/File:Dog_on_grass.jpg',
            width: 4000,
            height: 3000,
            mime: 'image/jpeg',
            extmetadata: { LicenseShortName: { value: 'Public domain' }, AttributionRequired: { value: 'false' } },
          },
        ],
      },
    ],
  },
};

describe('image search', () => {
  it('reads Openverse results with licence and a CORS-enabled download', () => {
    const r = openverseResults(openverse, 1);
    expect(r.next).toBe(2);
    expect(r.images[0]).toMatchObject({
      title: 'A cute Dog',
      creator: 'Chen Vision',
      license: 'CC BY-NC 2.0',
      provider: 'Flickr',
      attribution: true,
      full: 'https://api.openverse.org/v1/images/7992f788/thumb/?full_size=true',
    });
    expect(creditOf(r.images[0])).toBe('Chen Vision, CC BY-NC 2.0, Flickr');
    expect(r.images[1]).toMatchObject({ title: 'Ohne Titel', license: 'CC0', provider: 'Wikimedia Commons', attribution: false });
    expect(creditOf(r.images[1])).toBe('CC0, Wikimedia Commons');
    expect(openverseResults(openverse, 12).next).toBeNull();
  });

  it('reads Wikimedia Commons results in search order', () => {
    const r = commonsResults(commons, 0);
    expect(r.next).toBe(20);
    expect(r.images.map((i) => i.title)).toEqual(['Dog on grass', 'Map of the United Kingdom']);
    const [dog, map] = r.images;
    expect(dog).toMatchObject({ license: 'Public domain', attribution: false, creator: '' });
    expect(dog.full).toBe('https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Dog_on_grass.jpg/1280px-Dog_on_grass.jpg');
    expect(map).toMatchObject({ creator: 'Jane Doe', license: 'CC BY-SA 3.0', attribution: true });
    expect(map.full).toContain('/1280px-Map_of_the_United_Kingdom.svg.png');
    expect(creditOf(map)).toBe('Jane Doe, CC BY-SA 3.0, Wikimedia Commons');
  });

  it('names licences and strips HTML', () => {
    expect(licenseName('by-sa', '4.0')).toBe('CC BY-SA 4.0');
    expect(licenseName('pdm')).toBe('Public Domain');
    expect(plainText('<span>Photo by <b>Max &amp; Moritz</b></span>')).toBe('Photo by Max & Moritz');
    expect(commonsFull('https://x/orig.png', 'https://x/thumb/330px-orig.png', 'image/png', 900)).toBe('https://x/orig.png');
    expect(commonsFull('https://x/a.tif', 'https://x/thumb/lossy-page1-330px-a.tif.jpg', 'image/tiff', 900)).toBe('https://x/thumb/lossy-page1-330px-a.tif.jpg');
  });
});
