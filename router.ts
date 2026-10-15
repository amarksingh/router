require('@ostro/support/helpers')
const RouterContract = require('@ostro/contracts/router/router');
const path = require('path');
const MethodNotAvailable = require('@ostro/support/exceptions/methodNotAvailable');
const PageNotFoundException = require('@ostro/support/exceptions/pageNotFoundException');
const InvalidArgumentException = require('@ostro/support/exceptions/invalidArgumentException');
const InvalidRouteExceptions = require('./exceptions/invalidRouteExceptions');
const { Macroable } = require('@ostro/support/macro');
const Layer = require('./layer');
const { compose, composeWith, urlNormalize } = require('./utils');
const pathToRegexp = require('path-to-regexp');
const url = require('url');
const HttpContext = require('./httpContext');
const ExceptionHandler = require('./exceptionHandler');
const kLayers = Symbol('kLayers');
const kRegexConfig = Symbol('kRegexConfig');
const kMiddlewares = Symbol('middlewares');
const middlewares = Object.create(null);
const controllers = Object.create(null);
const stacks = [];
class Route {
    /**
     * $verbs property.
     * @type {any}
     */
    $verbs = ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

    /**
     * constructor method.
     *
     * @param {any} opt
     * @returns {any}
     */
    constructor(opt = {}) {
        opt = Object.assign({ prefix: '/', suffix: '/', namespace: '', middlewares: [], url: '/', name: '', handle: null, defaults: null }, opt)

        this.$currentStack = stacks.push({
            prefix: opt.prefix,
            suffix: opt.suffix,
            namespace: opt.namespace,
            middlewares: [...(opt.middlewares || [])],
            url: opt.url,
            name: opt.name,
            handle: null,
            methods: [],
            defaults: opt.defaults,
            domain: opt.domain
        }) - 1;
        this.$stack = stacks[this.$currentStack];
    }

    /**
     * get method.
     *
     * @param {any} uri
     * @param {any} action
     * @returns {any}
     */
    get($uri, $action = null) {
        return this.addRoute(['GET', 'HEAD'], $uri, $action);
    }

    /**
     * post method.
     *
     * @param {any} uri
     * @param {any} action
     * @returns {any}
     */
    post($uri, $action = null) {
        return this.addRoute('POST', $uri, $action);
    }

    /**
     * put method.
     *
     * @param {any} uri
     * @param {any} action
     * @returns {any}
     */
    put($uri, $action = null) {
        return this.addRoute('PUT', $uri, $action);
    }

    /**
     * patch method.
     *
     * @param {any} uri
     * @param {any} action
     * @returns {any}
     */
    patch($uri, $action = null) {
        return this.addRoute('PATCH', $uri, $action);
    }

    /**
     * delete method.
     *
     * @param {any} uri
     * @param {any} action
     * @returns {any}
     */
    delete($uri, $action = null) {
        return this.addRoute('DELETE', $uri, $action);
    }

    /**
     * options method.
     *
     * @param {any} uri
     * @param {any} action
     * @returns {any}
     */
    options($uri, $action = null) {
        return this.addRoute('OPTIONS', $uri, $action);
    }

    /**
     * any method.
     *
     * @param {any} uri
     * @param {any} action
     * @returns {any}
     */
    any($uri, $action = null) {
        return this.addRoute(this.$verbs, $uri, $action);
    }

    /**
     * redirect method.
     *
     * @param {any} uri
     * @param {any} destination
     * @param {any} status
     * @returns {any}
     */
    redirect($uri, $destination, $status = 302) {
        return this.any($uri, function ({
            response,
        }) {
            response.writeHead($status, {
                Location: $destination
            });
            response.end();
        })
    }

    /**
     * permanentRedirect method.
     *
     * @param {any} uri
     * @param {any} destination
     * @returns {any}
     */
    permanentRedirect($uri, $destination) {
        return this.redirect($uri, $destination, 301);
    }

    /**
     * view method.
     *
     * @param {any} uri
     * @param {any} view
     * @param {any} data
     * @param {any} status
     * @param {any} headers
     * @returns {any}
     */
    view($uri, $view, $data = {}, $status = 200, $headers = {}) {
        return this.match(['GET', 'HEAD'], $uri, require('./viewController'))
            .setDefaults({
                'view': $view,
                'data': $data,
                'status': $status ? $status : 200,
                'headers': $headers ? $headers : {},
            });
    }

    /**
     * match method.
     *
     * @param {any} methods
     * @param {any} uri
     * @param {any} action
     * @returns {any}
     */
    match($methods, $uri, $action = null) {
        $methods = $methods.map(method => method.toUpperCase());
        return this.addRoute($methods, $uri, $action);
    }

    /**
     * middleware method.
     *
     * @param {any} callback
     * @returns {any}
     */
    middleware(callback) {
        if (Array.isArray(callback))
            this.$stack.middlewares = this.$stack.middlewares.concat(callback);
        else
            this.$stack.middlewares.push(callback);
        return this
    }

    /**
     * prefix method.
     *
     * @param {any} prefix
     * @returns {any}
     */
    prefix(prefix) {
        this.$stack.prefix = this.$stack.prefix + prefix;
        return this
    }

    /**
     * suffix method.
     *
     * @param {any} suffix
     * @returns {any}
     */
    suffix(suffix) {
        this.$stack.suffix = this.$stack.suffix + suffix;
        return this
    }

    /**
     * domain method.
     *
     * @param {any} domain
     * @returns {any}
     */
    domain(domain) {
        this.$stack.domain = domain;
        return this;
    }

    /**
     * namespace method.
     *
     * @param {any} namespace
     * @returns {any}
     */
    namespace(namespace) {
        this.$stack.namespace = path.join(this.$stack.namespace, (namespace || ''));
        return this;
    }

    /**
     * name method.
     *
     * @param {any} name
     * @returns {any}
     */
    name(name) {
        this.$stack.name += name;
        return this;
    }

    /**
     * group method.
     *
     * @param {any} opt
     * @param {any} callback
     * @returns {any}
     */
    group(opt = {}, callback) {
        if (typeof opt == 'string') {
            callback = require(opt);
            opt = {};
        } else if (typeof opt == 'function') {
            callback = opt;
            opt = {};
        }
        let inst = new GroupRoute(opt, this.$stack);
        callback.call(inst, inst);
    }

    /**
     * setDefaults method.
     *
     * @param {any} defaults
     * @returns {any}
     */
    setDefaults(defaults) {
        this.$stack.defaults = {
            ...this.$stack.defaults,
            ...defaults
        };
    }

    /**
     * addRoute method.
     *
     * @param {any} methods
     * @param {any} uri
     * @param {any} action
     * @returns {any}
     */
    addRoute($methods, $uri, $action) {
        this.$stack.url = $uri;
        this.$stack.methods = $methods;
        this.$stack.handle = $action;
        return this
    }

}
class GroupRoute extends Macroable {
    opt = {}
    /**
     * constructor method.
     *
     * @param {any} opt
     * @param {any} old
     * @returns {any}
     */
    constructor(opt = null, old = {}) {
        super();

        if (opt == null && old == null) {
            return this;
        }
        opt = Object.assign({ prefix: '/', suffix: '/', namespace: '', middleware: [], url: '/', name: '', handle: null, defaults: null }, opt);
        old = Object.assign({ prefix: '/', suffix: '/', namespace: '', middlewares: [], url: '/', name: '', handle: null, defaults: null }, old);

        this.opt.prefix = old.prefix + opt.prefix;
        this.opt.suffix = old.suffix + opt.suffix;
        this.opt.namespace = opt.namespace ? path.join(old.namespace, opt.namespace) : old.namespace;
        this.opt.middlewares = old.middlewares.concat(opt.middleware);
        this.opt.url = old.url + opt.url;
        this.opt.name = old.name + opt.name;
        this.opt.handle = null;
        this.opt.defaults = null;
        this.opt.domain = opt.domain || old.domain;
    }
    /**
     * group method.
     *
     * @param {any} opt
     * @param {any} callback
     * @returns {any}
     */
    group(opt, callback) {
        if (typeof opt == 'string') {
            callback = require(opt);
            opt = {};
        } else if (typeof opt == 'function') {
            callback = opt;
            opt = {};
        }
        if (typeof this.opt == 'function') {
            this.opt = {};
        }
        let inst = new GroupRoute(opt, this.opt);
        callback.call(inst, inst);
    }

    /**
     * __get method.
     *
     * @param {any} target
     * @param {any} method
     * @returns {any}
     */
    __get(target, method) {
        return this.make(new Route(target.opt), method);
    }
}

class Router extends Macroable.extend(RouterContract) {
    /**
     * constructor method.
     *
     * @param {any} app
     * @param {any} regexConfig
     * @param {any} strict
     * @param {any} end
     * @returns {any}
     */
    constructor($app = {}, regexConfig = { sensitive: false, strict: false, end: true }) {
        super();
        this.$app = $app;
        this[kMiddlewares] = {
            default: [],
            named: {},
        };
        Object.defineProperty(this, kRegexConfig, {
            value: regexConfig,
            configurable: true,
            enumerable: false,
            writable: true
        });
        this.httpContextHandler(HttpContext);

    }

    /**
     * getMiddleware method.
     *
     * @param {any} middleware
     * @returns {any}
     */
    getMiddleware(middleware) {
        const middlewareName = middleware;
        let params = [];

        if (typeof middleware == 'string' && middleware.includes(':')) {
            let splitedMiddleware = middleware.split(':');
            middleware = splitedMiddleware[0];
            params = splitedMiddleware[1].split(',');
        }

        if (typeof middleware === 'function' || (typeof middleware === 'object' && middleware !== null)) {
            return this.resolveMiddleware(middleware, params);
        }

        if (middlewares[middlewareName]) {
            return middlewares[middlewareName];
        }

        if (!this[kMiddlewares]['named'][middleware])
            throw new MethodNotAvailable('middleware [{' + middleware + '}] is not available');

        let namedMiddleware = this[kMiddlewares]['named'][middleware];
        if (!Array.isArray(namedMiddleware)) {

            middlewares[middlewareName] = this.resolveMiddleware(namedMiddleware, params);

        } else {
            middlewares[middlewareName] = this[kMiddlewares]['named'][middleware].map(handler => {
                if (handler instanceof Array)
                    return handler.reduce((acc, val) => acc.concat(val), [])
                return handler
            }).map(handler => this.resolveMiddleware(handler, params)).filter(fn => fn);
        }
        return middlewares[middlewareName];
    }

    /**
     * resolveMiddleware method.
     *
     * @param {any} handler
     * @param {any} params
     * @returns {any}
     */
    resolveMiddleware(handler, params) {
        if (IsClass(handler)) {
            handler.prototype.$app = this.$app;
            handler = new handler(...params);
        }
        if (typeof handler == 'object' && handler !== null && !Array.isArray(handler)) {
            if (typeof handler.handle == 'function') {
                handler.handle = handler.handle.bind(handler);
            }
            if (typeof handler.terminate == 'function') {
                handler.terminate = handler.terminate.bind(handler);
            }
            return handler;
        } else if (handler) {
            return { handle: handler };
        }
    }

    /**
     * createLayer method.
     *
     * @param {any} stack
     * @returns {any}
     */
    createLayer(stack) {
        if (typeof stack.handle == 'string') {
            let [controller, callback] = stack.handle.split('::')
            let controllerPath = path.normalize(path.join(path.resolve(stack.namespace), controller))
            if (!controllers[controllerPath]) {
                let clazz = require(controllerPath);
                if (IsClass(clazz)) {
                    clazz.prototype.$app = this.$app;
                    clazz = new clazz(stack.defaults);
                }
                controllers[controllerPath] = clazz;
            }
            if (callback && !controllers[controllerPath][callback]) {
                throw new MethodNotAvailable(`Specified [{${callback}}] method was not available in [{${controllerPath}}]`);
            }
            stack.handle = controllers[controllerPath][callback].bind(controllers[controllerPath]);

        } else if (Array.isArray(stack.handle)) {
            let [controller, callback] = stack.handle;
            controller.prototype.$app = this.$app;
            controller = new controller(stack.defaults);
            stack.handle = controller[callback].bind(controller);
        } else {
            if (IsClass(stack.handle)) {
                stack.handle.prototype.$app = this.$app;
                stack.handle = new stack.handle(stack.defaults);
            }
            if (typeof stack.handle == 'object') {
                let callback = 'handle';
                if (callback && !stack.handle[callback]) {
                    throw new MethodNotAvailable(`Specified [{${callback}}] method was not available`);
                }
                stack.handle = stack.handle[callback].bind(stack.handle);
            }
        }
        let middlewares = stack.middlewares.map(middleware => this.getMiddleware(middleware)).reduce((acc, val) => acc.concat(val), []);
        middlewares.push({ handle: stack.handle });
        let url = urlNormalize('/', stack.prefix, stack.url, stack.suffix).replace(/^\/|\/$/g, '');
        const middlewareHandels = middlewares.map(middleware => middleware.handle).filter(fn => fn);
        const middlewareTerminates = middlewares.map(middleware => middleware.terminate).filter(fn => fn);
        return new Layer({
            url: '/' + url,
            methods: stack.methods,
            name: stack.name,
            domain: stack.domain,
            handle: compose(middlewareHandels),
            terminate: middlewareTerminates,

        }, {
            sensitive: this[kRegexConfig]['sensitive'] || false,
            strict: this[kRegexConfig]['strict'] || false,
            end: this[kRegexConfig]['end'] || true,
        })
    }

    /**
     * namedMiddleware method.
     *
     * @param {any} key
     * @param {any} value
     * @returns {any}
     */
    namedMiddleware(key, value) {
        this[kMiddlewares]['named'][key] = value;
    }

    /**
     * defaultMiddlewares method.
     *
     * @param {any} middlewares
     * @returns {any}
     */
    defaultMiddlewares(middlewares = []) {
        this[kMiddlewares]['default'] = this[kMiddlewares]['default'].concat(middlewares);
    }

    /**
     * resolveDefaultMiddleware method.
     *
     * @returns {any}
     */
    resolveDefaultMiddleware() {
        if (this[kMiddlewares]['default'] instanceof Array) {
            return this[kMiddlewares]['default'].map(middleware => {
                if (typeof middleware == 'string') {
                    middleware = require(path.normalize(middleware));
                }
                if (IsClass(middleware)) {
                    if (middlewares[middleware]) {
                        return middlewares[middleware];
                    }
                    middleware.prototype.$app = this.$app;
                    middlewares[middleware] = middleware = new middleware();

                    if (typeof middleware.handle == 'function') {
                        middleware.handle = middleware.handle.bind(middleware);
                    }
                    if (typeof middleware.terminate == 'function') {
                        middleware.terminate = middleware.terminate.bind(middleware);
                    }
                }
                return middleware;
            })
        }
        return []
    }

    /**
     * httpContextHandler method.
     *
     * @param {any} httpContext
     * @returns {any}
     */
    httpContextHandler(httpContext) {
        this.httpContext = httpContext;
    }

    /**
     * handle method.
     *
     * @returns {any}
     */
    handle() {
        const defaultTerminateMiddleware = {};
        this[kLayers] = stacks.filter(stack => stack.handle).map(stack => this.createLayer(stack));
        let self = this;
        let middlewares = [function urlHander({ request }, next) {
            if (typeof request._parsedUrl != 'object') {
                request._parsedUrl = url.parse(request.url, false);
            }
            next();
        }];
        const defaultMiddleare = this.resolveDefaultMiddleware();
        const defaultHandleMiddleWares = defaultMiddleare.map(middleware => middleware.handle).filter(fn => fn);
        let defaultTerminateMiddleWares = defaultMiddleare.map(middleware => middleware.terminate).filter(fn => fn);
        middlewares = middlewares.concat(defaultHandleMiddleWares);
        middlewares.push(async function layerHandler(ctx, next) {

            let layer = self[kLayers].find(route => {
                if (route.$domain != undefined && ctx.request.headers.host != route.$domain)
                    return false
                return (route.match(ctx.request._parsedUrl.pathname) && (route.$methods.indexOf(ctx.request.method) > -1));
            })
            if (layer) {
                await layer.handle_request(ctx, next);
            } else {
                return next(new PageNotFoundException());
            }
            if (!defaultTerminateMiddleware[layer.$regexp]) {
                const terminateMiddlewares = defaultTerminateMiddleWares.concat(layer.terminate);
                const errorHandlerTerminate = terminateMiddlewares.find(handle => handle.length == 3);
                defaultTerminateMiddleware[layer.$regexp] = {
                    terminate: compose(terminateMiddlewares.filter(handle => handle.length < 3)),
                    error: function (err) {
                        if (err && errorHandlerTerminate) {
                            errorHandlerTerminate(err, ctx)
                        }
                    }
                };
            }
            defaultTerminateMiddleware[layer.$regexp].terminate(ctx, defaultTerminateMiddleware[layer.$regexp].error);
            return next();
        })
        let exceptionHandler = new ExceptionHandler();
        let exceptionHandle = exceptionHandler.handle.bind(exceptionHandler);
        let exceptionTerminate = exceptionHandler.terminate.bind(exceptionHandler);
        Object.defineProperty(exceptionHandler, "name", {
            value: ExceptionHandler.name
        });
        middlewares = middlewares.filter(handler => {
            if (handler.length == 3) {
                exceptionHandle = handler
                return false
            }
            return true
        });
        defaultTerminateMiddleWares = defaultTerminateMiddleWares.filter(handler => {
            if (handler.length == 3) {
                exceptionTerminate = handler
                return false
            }
            return true
        });
        middlewares.push(exceptionHandle);
        defaultTerminateMiddleWares.push(exceptionTerminate);
        global.route = (name, params) => {
            return this.route(name, params)
        }
        return composeWith(middlewares)(this.httpContext)

    }

    /**
     * route method.
     *
     * @param {any} name
     * @param {any} ...params
     * @returns {any}
     */
    route(name, ...params) {

        let currentRoute = this[kLayers].find(layer => (layer.$name == name && name != ''));
        if (!currentRoute) {
            throw new InvalidRouteExceptions('Route name [{' + name + '}] not found');
        }
        let currentRouteParams = (currentRoute.$keys || []);
        if (currentRouteParams.length && currentRouteParams.length != params.length) {
            throw new InvalidArgumentException('Invalid Route params in [' + name + ']');
        }
        let mParams = {}
        for (let i = 0; i < currentRouteParams.length; i++) {
            mParams[currentRouteParams[i]['name']] = params[i];
        }
        return pathToRegexp.compile(currentRoute.$original, { encode: encodeURIComponent })(mParams, { validate: false });
    }

    /**
     * currentRoute method.
     *
     * @param {any} request
     * @returns {any}
     */
    currentRoute(request) {
        return this[kLayers].find(route => {
            if (route.$domain != undefined && request.headers.host != route.$domain)
                return false;
            return (route.match(request._parsedUrl.pathname) && (route.$methods.indexOf(request.method) > -1));
        })
    }

    /**
     * bindToResponse method.
     *
     * @param {any} HttpResponse
     * @returns {any}
     */
    bindToResponse(HttpResponse) {
        let self = this;

        HttpResponse.prototype.route = function (name, params) {
            this.redirect(self.route(name, params));
        };
    }
    /**
     * __get method.
     *
     * @param {any} target
     * @param {any} method
     * @returns {any}
     */
    __get(target, method) {
        return this.make(new GroupRoute, method);
    }

}
Router.clear = function() {
    stacks.length = 0;
    for (let key of Object.keys(middlewares)) {
        delete middlewares[key];
    }
    for (let key of Object.keys(controllers)) {
        delete controllers[key];
    }
};

Router.getStacks = function() {
    return stacks;
};

Router.Route = Route;
Router.GroupRoute = GroupRoute;

module.exports = Router
