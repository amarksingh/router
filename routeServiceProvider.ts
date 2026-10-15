const ServiceProvider = require('@ostro/support/serviceProvider');
const Router = require('./router')
class RouteServiceProvider extends ServiceProvider {
    /**
     * $namespace property.
     * @type {any}
     */
    $namespace = '';

    regexConfig = {
        sensitive: false,
        strict: false,
        end: true,
    };

    kernal = {
        default: [],
        named: {}
    };

    /**
     * register method.
     *
     * @returns {any}
     */
    register() {
        this.registerRouter()
    }
    
    /**
     * map method.
     *
     * @returns {any}
     */
    map() {

    }
    
    /**
     * boot method.
     *
     * @returns {any}
     */
    boot() {
        this.map()
    }

    /**
     * registerRouter method.
     *
     * @returns {any}
     */
    registerRouter() {
        this.$app.singleton('router', (app => {
            return new Router(app, this.regexConfig)
        }))
    }

}
module.exports = RouteServiceProvider