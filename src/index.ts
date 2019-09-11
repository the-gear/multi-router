export type RouteParams = {
  readonly [name: string]: string;
};

export type RouteAlias = {
  readonly path: string;
  readonly imply?: RouteParams;
};

export type RouteLoader<R> = (params: RouteParams, route: Route<R>) => R;

export type Route<R> = {
  readonly name: string;
  readonly path: string;
  readonly imply?: RouteParams;
  readonly alias?: RouteAlias[];
  readonly load: RouteLoader<R>;
};

export type Routes<R> = Array<Route<R>>;

interface PreparedRoute<T> {
  readonly route: Route<T>;
  readonly imply: RouteParams;
}

export type ResolveResult<T> = Partial<T>;

export type RouteName = string | number;

export default class Router<T> {
  routeByName: Map<string, Route<T>>;

  // absolute paths
  routeByAbsPath: Map<string, PreparedRoute<T>>;

  currentRouteName?: RouteName;

  constructor(routes?: Routes<T>) {
    this.routeByName = new Map<string, Route<T>>();
    this.routeByAbsPath = new Map<string, PreparedRoute<T>>();
    if (routes) this.addRoutes(routes);
  }

  getHref(name: string, params: RouteParams = {}): string {
    const route = this.routeByName.get(name);
    if (!route) {
      throw new Error(`Unknown route: '${name}'`);
    }
    let path = route.path;
    if (params) {
      const queryKeys = new Set(Object.keys(params));
      if (Array.isArray(route.alias)) {
        const filtered = route.alias.filter(
          (alias) =>
            alias.imply &&
            Object.keys(alias.imply).every(
              (key) => alias.imply && alias.imply[key] === params[key],
            ),
        );
        if (filtered.length > 1) {
          // sort descending by
          filtered.sort(
            (a, b) => Object.keys(b.imply || {}).length - Object.keys(a.imply || {}).length,
          );
        }
        if (filtered.length >= 1) {
          const alias = filtered[0];
          path = alias.path;
          // remove params which can be implied to make url nicer
          if (alias.imply) {
            Object.keys(alias.imply).forEach((key) => queryKeys.delete(key));
          }
        }
      }
      if (queryKeys.size) {
        const search = Array.from(queryKeys)
          .map((key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
          .join('&');
        path = `${path}?${search}`;
      }
    }

    // TODO: process params
    return path;
  }

  addRoutes(routes: Routes<T>) {
    routes.forEach((route) => {
      this.routeByName.set(route.name, route);
      this.routeByAbsPath.set(route.path, {
        route,
        imply: { ...route.imply },
      });
      if (Array.isArray(route.alias)) {
        route.alias.forEach((alias) => {
          this.routeByAbsPath.set(alias.path, {
            route,
            imply: { ...route.imply, ...alias.imply },
          });
        });
      }
    });
  }

  resolve(path: string, params?: RouteParams): ResolveResult<T> | null {
    const exactRoute = this.routeByAbsPath.get(path);
    if (exactRoute) {
      const name = exactRoute.route.name;
      this.currentRouteName = name;

      return {
        name,
        ...exactRoute.route.load({ ...params, ...exactRoute.imply }, exactRoute.route),
      };
    }

    return null;
  }
}
