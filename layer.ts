import { pathToRegexp, Key } from 'path-to-regexp';
import { decode_param } from './utils';

const hasOwnProperty = Object.prototype.hasOwnProperty;

interface LayerStack {
    handle: Function;
    terminate?: any;
    name?: string;
    domain?: string;
    url: string;
    methods?: string[];
    [key: string]: any;
}

interface LayerOptions {
    sensitive?: boolean;
    strict?: boolean;
    end?: boolean;
    [key: string]: any;
}

interface RegExpWithFlags extends RegExp {
    fast_star?: boolean;
    fast_slash?: boolean;
}

interface LayerInstance {
    handle: Function;
    terminate?: any;
    $name?: string;
    $domain?: string;
    $original: string;
    $methods?: string[];
    $path?: string;
    $regexp: RegExpWithFlags;
    $keys: Key[];
    $params?: Record<string, any>;
    handle_error(error: any, ctx: any, next: Function): any;
    handle_request(ctx: any, next: Function): any;
    match(path: string | null | undefined): boolean;
}

interface LayerConstructor {
    new (stack: LayerStack, opts?: LayerOptions): LayerInstance;
    (stack: LayerStack, opts?: LayerOptions): LayerInstance;
    prototype: LayerInstance;
}

/**
 * Route layer representing an individual route or middleware stack unit.
 *
 * @param stack - Stack configuration containing url, handle, methods, etc.
 * @param opts - Options for pathToRegexp compilation.
 */
function Layer(this: any, stack: LayerStack, opts: LayerOptions = {}): LayerInstance {
    if (!(this instanceof Layer)) {
        return new (Layer as any)(stack, opts);
    }

    this.handle = stack.handle;
    this.terminate = stack.terminate;
    this.$name = stack.name;
    this.$domain = stack.domain;
    this.$original = stack.url;
    this.$methods = stack.methods;
    this.$path = undefined;
    this.$regexp = pathToRegexp(stack.url, (this.$keys = []), opts) as RegExpWithFlags;
    this.$params = this.$keys as any;
    this.$regexp.fast_star = stack.url === '*';
    this.$regexp.fast_slash = stack.url === '/' && opts.end === false;
    return this;
}

/**
 * Handle error by invoking handler if it takes 3 arguments, else forward error.
 *
 * @param error - The caught error.
 * @param ctx - Context object.
 * @param next - Next callback.
 */
Layer.prototype.handle_error = function (error: any, ctx: any, next: Function): any {
    const fn: Function = this.handle;

    if (fn.length !== 3) {
        return next(error);
    }

    try {
        return fn(error, ctx, next);
    } catch (err: any) {
        return next(err);
    }
};

/**
 * Handle incoming request by passing to handler.
 *
 * @param ctx - Context object.
 * @param next - Next callback.
 */
Layer.prototype.handle_request = function (ctx: any, next: Function): any {
    const fn: Function = this.handle;
    ctx.request.params = this.$params;

    if (fn.length > 2) {
        return next();
    }

    try {
        return fn(ctx, next);
    } catch (err: any) {
        return next(err);
    }
};

/**
 * Check if the given path matches this layer's regex.
 *
 * @param path - URL pathname to match.
 * @returns True if matched, false otherwise.
 */
Layer.prototype.match = function (path: string | null | undefined): boolean {
    let match: RegExpExecArray | null = null;

    if (path != null) {
        if (this.$regexp.fast_slash) {
            this.$params = {};
            this.$path = '';
            return true;
        }

        if (this.$regexp.fast_star) {
            this.$params = {
                '0': decode_param(path)
            };
            this.$path = path;
            return true;
        }

        match = this.$regexp.exec(path);
    }

    if (!match) {
        this.$params = undefined;
        this.$path = undefined;
        return false;
    }

    this.$params = {};
    this.$path = match[0];

    const keys: Key[] = this.$keys;
    const params: Record<string, any> = this.$params;

    for (let i = 1; i < match.length; i++) {
        const key: Key = keys[i - 1];
        const prop: string | number = key.name;
        const val: any = decode_param(match[i]);

        if (val !== undefined || !(hasOwnProperty.call(params, prop))) {
            params[prop] = val;
        }
    }

    return true;
};

const ExportedLayer: LayerConstructor = Layer as unknown as LayerConstructor;

export default ExportedLayer;
