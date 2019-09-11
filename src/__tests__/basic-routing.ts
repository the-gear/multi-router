/* eslint-env jest */

import Router, { Routes } from '..';

describe('Router', () => {
  describe('with no configuration', () => {
    it('should create', () => {
      const router = new Router();
      expect(router).toBeInstanceOf(Router);
    });

    it('resolve should return null', () => {
      const router = new Router();
      expect(router.resolve('/')).toBeNull();
    });

    it('getHref should throw', () => {
      const router = new Router();
      expect(() => router.getHref('undefined')).toThrowErrorMatchingInlineSnapshot(
        `"Unknown route: 'undefined'"`,
      );
    });
  });

  describe('with simple configuration', () => {
    const homeResult = { name: 'home' };
    const aboutResult = { name: 'about' };
    const config: Routes<{ name: string }> = [
      {
        name: 'home',
        path: '/',
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
      expect(router.resolve('/about')).toEqual({
        ...aboutResult,
      });
    });

    it('getHref should work', () => {
      const router = new Router(config);
      expect(router.getHref('home')).toBe('/');
      expect(router.getHref('about')).toBe('/about');
      expect(() => router.getHref('undefined')).toThrowErrorMatchingInlineSnapshot(
        `"Unknown route: 'undefined'"`,
      );
    });
  });
});
