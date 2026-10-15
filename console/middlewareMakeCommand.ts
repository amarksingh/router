import path from 'path';
import GeneratorCommand from '@ostro/console/generatorCommand';
import { trim } from '@ostro/support/function';

/**
 * Console command for generating new middleware classes.
 */
class MiddlewareMakeCommand extends GeneratorCommand {
    /**
     * The console command name.
     */
    public $signature: string = 'make:middleware';

    /**
     * The console command description.
     */
    public $description: string = 'Create a new middleware class';

    /**
     * The type of class being generated.
     */
    public $type: string = 'Middleware';

    /**
     * Get the stub file for the generator.
     *
     * @returns The resolved stub file path.
     */
    public getStub(): Promise<string> {
        return this.resolveStubPath('/stubs/middleware.stub');
    }

    /**
     * Resolve the stub path for the generator.
     *
     * @param $stub - Relative stub path.
     * @returns The resolved stub path.
     */
    public resolveStubPath($stub: string): Promise<string> {
        const $customPath: string = this.$app.basePath(trim($stub, '/'));
        return this.$file.exists($customPath).then(($exists: boolean) => ($exists ? $customPath : path.join(__dirname, $stub)));
    }

    /**
     * Get the default namespace for the class.
     *
     * @param $rootNamespace - Root application namespace.
     * @returns The default namespace path.
     */
    public getDefaultNamespace($rootNamespace: string): string {
        return path.join($rootNamespace, 'app', 'http', 'middleware');
    }
}

export = MiddlewareMakeCommand;