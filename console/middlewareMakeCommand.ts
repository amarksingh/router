const path = require('path');
const GeneratorCommand = require('@ostro/console/generatorCommand');
const { trim } = require('@ostro/support/function');

class MiddlewareMakeCommand extends GeneratorCommand {

    /**
     * $signature property.
     * @type {any}
     */
    $signature = 'make:middleware';

    /**
     * $description property.
     * @type {any}
     */
    $description =  'Create a new middleware class';

    /**
     * $type property.
     * @type {any}
     */
    $type =  'Middleware';

    /**
     * getStub method.
     *
     * @returns {any}
     */
    getStub() {
        return this.resolveStubPath('/stubs/middleware.stub');
    }

    /**
     * resolveStubPath method.
     *
     * @param {any} stub
     * @returns {any}
     */
    resolveStubPath($stub) {
        let $customPath = this.$app.basePath(trim($stub, '/'))
        return this.$file.exists($customPath).then($exists => ($exists ? $customPath : path.join(__dirname, $stub)))
    }

    /**
     * getDefaultNamespace method.
     *
     * @param {any} rootNamespace
     * @returns {any}
     */
    getDefaultNamespace($rootNamespace) {
        return path.join($rootNamespace, 'app', 'http', 'middleware');
    }

}

module.exports = MiddlewareMakeCommand