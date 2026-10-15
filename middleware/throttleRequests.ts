
const ThrottleRequestsException = require('@ostro/http/exception/throttleRequestsException');
const HttpException = require('@ostro/http/exception/httpException');
const RateLimiter = require('@ostro/cache/rateLimiter');
const Unlimited = require('@ostro/cache/rateLimiting/unlimited');
const InteractsWithTime = require('@ostro/support/interactsWithTime');
const { get_class_name, is_string, is_null, is_numeric, str_contains, is_callable, collect, md5, sha1 } = require("@ostro/support/function");
const Arr = require('@ostro/support/array');
const Response = require('@ostro/http/response');

class ThrottleRequests extends InteractsWithTime {

    /**
     * $limiter property.
     * @type {any}
     */
    $limiter;
    /**
     * $maxAttempts property.
     * @type {any}
     */
    $maxAttempts;
    /**
     * $decayMinutes property.
     * @type {any}
     */
    $decayMinutes;
    /**
     * $prefix property.
     * @type {any}
     */
    $prefix;

    static $shouldHashKeys = true;


    /**
     * constructor method.
     *
     * @param {any} maxAttempts
     * @param {any} decayMinutes
     * @param {any} prefix
     * @returns {any}
     */
    constructor($maxAttempts = 60, $decayMinutes = 1, $prefix = '') {
        super()
        this.$maxAttempts = $maxAttempts;
        this.$decayMinutes = $decayMinutes;
        this.$prefix = $prefix;
        this.$limiter = new RateLimiter(this.$app ? this.$app.cache : null);
    }

    /**
     * using method.
     *
     * @static
     * @param {any} name
     * @returns {any}
     */
    static using($name) {
        return get_class_name(this) + ':' + $name;
    }

    /**
     * with method.
     *
     * @static
     * @param {any} maxAttempts
     * @param {any} decayMinutes
     * @param {any} prefix
     * @returns {any}
     */
    static with($maxAttempts = 60, $decayMinutes = 1, $prefix = '') {
        const args = [...arguments];
        args[0] = args[0] || $maxAttempts;
        args[1] = args[1] || $decayMinutes;
        args[2] = args[2] || $prefix;
        return get_class_name(this) + ':' + args.join(',');
    }

    /**
     * handle method.
     *
     * @async
     * @param {any} { request
     * @param {any} response
     * @param {any} next }
     * @returns {any}
     */
    async handle({ request, response, next }) {
        const $limiter = is_string(this.$maxAttempts) ? this.$limiter.limiter(this.$maxAttempts) : null;
        if (
            !is_null($limiter)) {
            return this.handleRequestUsingNamedLimiter(request, response, next, this.$maxAttempts, $limiter);
        }

        return this.handleRequest(
            request,
            response,
            next,
            [
                {
                    'key': this.$prefix + await this.resolveRequestSignature(request),
                    'maxAttempts': await this.resolveMaxAttempts(request, this.$maxAttempts),
                    'decayMinutes': this.$decayMinutes,
                    'responseCallback': null,
                },
            ]
        );
    }

    /**
     * handleRequestUsingNamedLimiter method.
     *
     * @param {any} request
     * @param {any} response
     * @param {any} next
     * @param {any} limiterName
     * @param {any} limiter
     * @returns {any}
     */
    handleRequestUsingNamedLimiter(request, response, next, $limiterName, $limiter) {
        const $limiterResponse = $limiter(request);

        if ($limiterResponse instanceof Response) {
            return $limiterResponse;
        } else if ($limiterResponse instanceof Unlimited) {
            return next();
        }

        return this.handleRequest(
            request,
            response,
            next,
            collect(Arr.wrap($limiterResponse)).map(($limit) => {
                return {
                    'key': this.constructor.$shouldHashKeys ? md5($limiterName + ':' + $limit.key) : $limiterName + ':' + $limit.key,
                    'maxAttempts': $limit.maxAttempts,
                    'decayMinutes': $limit.decayMinutes,
                    'responseCallback': $limit.responseCallback,
                };
            }).all()
        );
    }


    /**
     * handleRequest method.
     *
     * @async
     * @param {any} request
     * @param {any} response
     * @param {any} next
     * @param {any} limits
     * @returns {any}
     */
    async handleRequest(request, response, next, $limits = []) {
        for (let $limit of $limits) {
            if (await this.$limiter.tooManyAttempts($limit.key, $limit.maxAttempts)) {
                return next(await this.buildException(request, $limit.key, $limit.maxAttempts, $limit.responseCallback));
            }

            await this.$limiter.hit($limit.key, $limit.decayMinutes * 60);
        }

        for (let $limit of $limits) {
            response = this.addHeaders(
                response,
                $limit.maxAttempts,
                await this.calculateRemainingAttempts($limit.key, $limit.maxAttempts)
            );
        }

        return next();
    }

    /**
     * resolveMaxAttempts method.
     *
     * @async
     * @param {any} request
     * @param {any} maxAttempts
     * @returns {any}
     */
    async resolveMaxAttempts(request, $maxAttempts = '') {
        const $user = await request.user();
        if (str_contains($maxAttempts, '|')) {
            $maxAttempts = $maxAttempts.split('|', 2)[$user ? 1 : 0];
        }

        if (!is_numeric($maxAttempts) && $user) {
            $maxAttempts = $user[$maxAttempts];
        }

        return parseInt($maxAttempts);
    }

    /**
     * resolveRequestSignature method.
     *
     * @async
     * @param {any} request
     * @returns {any}
     */
    async resolveRequestSignature(request) {
        const $domain = request.hostname();
        const $user = await request.user()
        if ($user) {
            return this.formatIdentifier($user.getAuthIdentifier());
        } else if ($domain) {
            return this.formatIdentifier($domain + '|' + request.ip());
        }

        throw new Error('Unable to generate the request signature. Route unavailable.');
    }

    /**
     * buildException method.
     *
     * @async
     * @param {any} request
     * @param {any} key
     * @param {any} maxAttempts
     * @param {any} responseCallback
     * @returns {any}
     */
    async buildException(request, $key, $maxAttempts, responseCallback = null) {
        const $retryAfter = await this.getTimeUntilNextRetry($key);

        const $headers = this.getHeaders(
            $maxAttempts,
            await this.calculateRemainingAttempts($key, $maxAttempts, $retryAfter),
            $retryAfter
        );

        return is_callable(responseCallback)
            ? new HttpException(responseCallback(request, $headers))
            : new ThrottleRequestsException(null, 'Too Many Attempts.', $headers);
    }

    /**
     * getTimeUntilNextRetry method.
     *
     * @param {any} key
     * @returns {any}
     */
    getTimeUntilNextRetry($key) {
        return this.$limiter.availableIn($key);
    }

    /**
     * addHeaders method.
     *
     * @param {any} response
     * @param {any} maxAttempts
     * @param {any} remainingAttempts
     * @param {any} retryAfter
     * @returns {any}
     */
    addHeaders(response, $maxAttempts, $remainingAttempts, $retryAfter = null) {
        const headers = this.getHeaders($maxAttempts, $remainingAttempts, $retryAfter, response);
        for (let key in headers) {
            response.header(
                key,
                headers[key]
            );
        }


        return response;
    }


    /**
     * getHeaders method.
     *
     * @param {any} maxAttempts
     * @param {any} remainingAttempts
     * @param {any} retryAfter
     * @param {any} response
     * @returns {any}
     */
    getHeaders($maxAttempts, $remainingAttempts, $retryAfter = null, response = null) {
        if (response &&
            !is_null(response.header('X-RateLimit-Remaining')) &&
            parseInt(response.header('X-RateLimit-Remaining')) <= parseInt($remainingAttempts)) {
            return [];
        }

        const $headers = {
            'X-RateLimit-Limit': $maxAttempts,
            'X-RateLimit-Remaining': $remainingAttempts,
        };

        if (!is_null($retryAfter)) {
            $headers['Retry-After'] = $retryAfter;
            $headers['X-RateLimit-Reset'] = this.availableAt($retryAfter);
        }

        return $headers;
    }


    /**
     * calculateRemainingAttempts method.
     *
     * @param {any} key
     * @param {any} maxAttempts
     * @param {any} retryAfter
     * @returns {any}
     */
    calculateRemainingAttempts($key, $maxAttempts, $retryAfter = null) {
        return is_null($retryAfter) ? this.$limiter.retriesLeft($key, $maxAttempts) : 0;
    }

    /**
     * formatIdentifier method.
     *
     * @param {any} value
     * @returns {any}
     */
    formatIdentifier($value) {
        return this.constructor.$shouldHashKeys ? sha1($value) : $value;
    }


    /**
     * shouldHashKeys method.
     *
     * @static
     * @param {any} shouldHashKeys
     * @returns {any}
     */
    static shouldHashKeys($shouldHashKeys = true) {
        this.$shouldHashKeys = $shouldHashKeys;
    }
}

module.exports = ThrottleRequests