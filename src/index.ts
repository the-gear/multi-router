import {
  Key,
  parse,
  ParseOptions,
  PathFunction,
  tokensToFunction,
  TokensToFunctionOptions,
  tokensToRegExp,
} from 'path-to-regexp';

export type RouteParams = {
  [name: string]: string;
};

export type RoutePathOptions = ParseOptions & TokensToFunctionOptions;

export interface RoutePath {
  readonly path: string;
  readonly options?: RoutePathOptions;
  readonly imply?: RouteParams;
}

export type RouteLoader<R> = (params: RouteParams, route: Route<R>) => R;

export interface Route<R> extends RoutePath {
  readonly name: string;
  readonly alias?: RoutePath[];
  readonly load: RouteLoader<R>;
}

export type Routes<R> = ReadonlyArray<Route<R>>;

export type ResolveResult<R> = Partial<R>;

export type RouteName = string | number;

interface PreparedPath<R> {
  readonly route: Route<R>;
  readonly imply: RouteParams;
}

interface PreparedParametrizedPath<R> extends PreparedPath<R> {
  readonly regexp: RegExp;
  readonly compile: PathFunction<RouteParams>;
  readonly keys: Key[];
}

export default class Router<R> {
  routeByName: Map<string, Route<R>>;

  // absolute paths
  routeByAbsPath: Map<string, PreparedPath<R>>;

  parametrizedPaths: Array<PreparedParametrizedPath<R>>;

  constructor(routes?: Routes<R>) {
    this.routeByName = new Map<string, Route<R>>();
    this.routeByAbsPath = new Map<string, PreparedPath<R>>();
    this.parametrizedPaths = [];
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

  addRouteAlias(route: Route<R>, alias: RoutePath) {
    const path = alias.path;
    const tokens = parse(path);
    const isAbsPath = tokens.every((token) => typeof token === 'string');
    if (isAbsPath) {
      this.routeByAbsPath.set(path, {
        route,
        imply: { ...route.imply, ...alias.imply },
      });
    } else {
      const options = alias.options || route.options;
      const keys: Key[] = [];
      const regexp = tokensToRegExp(tokens, keys, options);
      const compile = tokensToFunction(tokens, options);

      this.parametrizedPaths.push({
        route,
        imply: { ...route.imply, ...alias.imply },
        regexp,
        compile,
        keys,
      });
    }
  }

  addRoutes(routes: Routes<R>) {
    routes.forEach((route) => {
      this.routeByName.set(route.name, route);
      this.addRouteAlias(route, route);
      if (Array.isArray(route.alias)) {
        route.alias.forEach((alias) => this.addRouteAlias(route, alias));
      }
    });
  }

  resolve(path: string, params?: RouteParams): ResolveResult<R> | null {
    const exactRoute = this.routeByAbsPath.get(path);
    if (exactRoute) {
      const name = exactRoute.route.name;

      return {
        name,
        ...exactRoute.route.load({ ...params, ...exactRoute.imply }, exactRoute.route),
      };
    } else {
      for (const aliasedPath of this.parametrizedPaths) {
        const match = aliasedPath.regexp.exec(path);
        if (match) {
          const { route } = aliasedPath;
          const matches = aliasedPath.keys.reduce(
            (result, key, idx) => {
              result[key.name] = match[idx + 1];

              return result;
            },
            {} as RouteParams,
          );

          return {
            name: route.name,
            ...route.load({ ...params, ...route.imply, ...matches }, route),
          };
        }
      }
    }

    return null;
  }
}
