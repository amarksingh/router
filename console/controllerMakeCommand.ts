require('@ostro/support/helpers');
const path = require('path');
const GeneratorCommand = require('@ostro/console/generatorCommand');
const InvalidArgumentException = require('@ostro/support/exceptions/invalidArgumentException');
const { trim, class_basename } = require('@ostro/support/function');
class ControllerMakeCommand extends GeneratorCommand {

    /**
     * $signature property.
     * @type {any}
     */
    $signature = 'make:controller';

    /**
     * $description property.
     * @type {any}
     */
    $description = 'Create a new controller class';

    $options =  [
            this.createOption('--force', 'Create the class even if the controller already exists'),
            this.createOption('-m, --model [model]', 'Generate a resource controller for the given model.'),
            this.createOption('-r, --resource', 'Generate a resource controller class.')
    ];

    /**
     * $type property.
     * @type {any}
     */
    $type = 'Controller';

    /**
     * getStub method.
     *
     * @returns {any}
     */
    getStub() {
        let $stub = null;
        let $type
        if ($type = this.option('type')) {
            $stub = `/stubs/controller.${$type}.stub`;
        } else if (this.option('model')) {
            $stub = '/stubs/controller.model.stub';
        } else if (this.option('resource')) {
            $stub = '/stubs/controller.stub';
        }

        $stub = $stub || '/stubs/controller.plain.stub';

        return this.resolveStubPath($stub);
    }

    /**
     * resolveStubPath method.
     *
     * @param {any} stub
     * @returns {any}
     */
    resolveStubPath($stub: any) {
        let $customPath = this.$app.basePath(trim($stub, '/'))
        return this.$file.exists($customPath).then($exists => ($exists ? $customPath : path.join(__dirname, $stub)))
    }

    /**
     * getDefaultNamespace method.
     *
     * @param {any} rootNamespace
     * @returns {any}
     */
    getDefaultNamespace($rootNamespace: any) {
        return path.join($rootNamespace, 'app', 'http', 'controllers');
    }

    /**
     * buildClass method.
     *
     * @async
     * @param {any} name
     * @returns {any}
     */
    async buildClass($name: string) {

        let $controllerNamespace = this.getNamespace($name);
        let $replace = {};
        if (this.option('model')) {
            $replace = await this.buildModelReplacements($replace);
        }

        return super.buildClass($name).then(content => content.replaceAllArray(Object.keys($replace), Object.values($replace)))
    }

    /**
     * buildModelReplacements method.
     *
     * @async
     * @param {any} replace
     * @returns {any}
     */
    async buildModelReplacements($replace: any) {
        let $modelClass = this.parseModel(this.option('model'));

        if (!await this.$file.exists(!$modelClass.endsWith('.js') ? $modelClass+'.js' : $modelClass)) {
            if (await this.confirm(`A ${$modelClass} model does not exist. Do you want to generate it?`, true)) {
                this.callCommand('make:model', {
                    'name': $modelClass
                });
            }
        }
        $modelClass = $modelClass.replace(this.rootNamespace(), '~').replaceAll('\\', '/').trim('/')
        return Object.assign($replace, {
            'DummyFullModelClass': $modelClass,
            '{{ namespacedModel }}': $modelClass,
            '{{namespacedModel}}': $modelClass,
            'DummyModelClass': class_basename($modelClass),
            '{{ model }}': class_basename($modelClass),
            '{{model}}': class_basename($modelClass),
            'DummyModelVariable': class_basename($modelClass).ucfirst(),
            '{{ modelVariable }}': class_basename($modelClass).ucfirst(),
            '{{modelVariable}}': class_basename($modelClass).ucfirst(),
        });
    }

    /**
     * parseModel method.
     *
     * @param {any} model
     * @returns {any}
     */
    parseModel($model: any) {

        if($model && typeof $model == 'boolean'){
            throw new InvalidArgumentException('Invalid model name')
        }
        return this.qualifyModel($model);
    }

}

module.exports = ControllerMakeCommand