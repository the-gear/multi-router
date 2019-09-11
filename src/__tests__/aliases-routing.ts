/* eslint-env jest */

import Router, { Routes } from '..';

describe('Router', () => {
  describe('with configuration containing aliases', () => {
    const config: Routes<{}> = [
      {
        name: 'home',
        path: '/',
        alias: [{ path: '/a', imply: { a: 'a' } }, { path: '/ab', imply: { a: 'a', b: 'b' } }],
        load: (params) => params,
      },
      {
        name: 'about',
        path: '/about',
        load: (params) => params,
      },
      {
        name: 'article',
        path: '/article/:slug',
        load: (params) => params,
      },
    ];

    it('should create', () => {
      const router = new Router(config);
      expect(router).toBeInstanceOf(Router);
    });

    it('resolve should work', () => {
      const router = new Router(config);
      expect(router.resolve('/')).toMatchInlineSnapshot(`
        Object {
          "name": "home",
        }
      `);
      expect(router.resolve('/a')).toMatchInlineSnapshot(`
        Object {
          "a": "a",
          "name": "home",
        }
      `);
      expect(router.resolve('/ab')).toMatchInlineSnapshot(`
        Object {
          "a": "a",
          "b": "b",
          "name": "home",
        }
      `);
      expect(router.resolve('/about')).toMatchInlineSnapshot(`
        Object {
          "name": "about",
        }
      `);
      expect(router.resolve('/article/the-slug-1')).toMatchInlineSnapshot(`
        Object {
          "name": "article",
          "slug": "the-slug-1",
        }
      `);
    });

    it('getHref should work', () => {
      const router = new Router(config);
      expect(router.getHref('home')).toBe('/');
      expect(router.getHref('home', { a: 'a' })).toBe('/a');
      expect(router.getHref('home', { a: 'a', b: 'b' })).toBe('/ab');
      expect(router.getHref('home', { a: 'a', b: 'c' })).toBe('/a?b=c');
      expect(router.getHref('home', { a: 'a', b: 'b', c: 'C' })).toBe('/ab?c=C');
      expect(() => router.getHref('undefined')).toThrowErrorMatchingInlineSnapshot(
        `"Unknown route: 'undefined'"`,
      );
    });
  });
});
