/* eslint-env jest */

import Router, { Routes } from '..';

describe('Router', () => {
  describe('with configuration containing aliases', () => {
    const homeResult = { name: 'home' };
    const aboutResult = { name: 'about' };
    const config: Routes<{ name: string }> = [
      {
        name: 'home',
        path: '/',
        alias: [{ path: '/a', imply: { a: 'a' } }, { path: '/ab', imply: { a: 'a', b: 'b' } }],
        load: () => homeResult,
      },
      {
        name: 'about',
        path: '/about',
        load: () => aboutResult,
      },
    ];

    it('should create', () => {
      const router = new Router(config);
      expect(router).toBeInstanceOf(Router);
    });

    it('resolve should work', () => {
      const router = new Router(config);
      expect(router.resolve('/')).toEqual({ ...homeResult });
      expect(router.resolve('/a')).toEqual({ ...homeResult });
      expect(router.resolve('/ab')).toEqual({ ...homeResult });
      expect(router.resolve('/about')).toEqual({
        ...aboutResult,
      });
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
