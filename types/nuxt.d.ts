/** Declaration file generated by dts-gen */

export class Builder {
    constructor(...args: any[]);

    addOptionalTemplates(...args: any[]): void;

    assignWatcher(...args: any[]): void;

    build(...args: any[]): void;

    close(...args: any[]): void;

    compileTemplates(...args: any[]): void;

    createFileWatcher(...args: any[]): void;

    createTemplateContext(...args: any[]): void;

    forGenerate(...args: any[]): void;

    generateRoutesAndFiles(...args: any[]): void;

    getBundleBuilder(...args: any[]): void;

    getServerMiddlewarePaths(...args: any[]): void;

    globPathWithExtensions(...args: any[]): void;

    normalizePlugins(...args: any[]): void;

    resolveCustomTemplates(...args: any[]): void;

    resolveFiles(...args: any[]): void;

    resolveLayouts(...args: any[]): void;

    resolveLoadingIndicator(...args: any[]): void;

    resolveMiddleware(...args: any[]): void;

    resolvePlugins(...args: any[]): void;

    resolveRelative(...args: any[]): void;

    resolveRoutes(...args: any[]): void;

    resolveStore(...args: any[]): void;

    unwatch(...args: any[]): void;

    validatePages(...args: any[]): void;

    validateTemplate(...args: any[]): void;

    watchClient(...args: any[]): void;

    watchRestart(...args: any[]): void;

}

export class Generator {
    constructor(...args: any[]);

    afterGenerate(...args: any[]): void;

    decorateWithPayloads(...args: any[]): void;

    generate(...args: any[]): void;

    generateRoute(...args: any[]): void;

    generateRoutes(...args: any[]): void;

    initDist(...args: any[]): void;

    initRoutes(...args: any[]): void;

    initiate(...args: any[]): void;

    minifyHtml(...args: any[]): void;

}

export class Module {
    constructor(...args: any[]);

    addErrorLayout(...args: any[]): void;

    addLayout(...args: any[]): void;

    addModule(...args: any[]): void;

    addPlugin(...args: any[]): void;

    addServerMiddleware(...args: any[]): void;

    addTemplate(...args: any[]): void;

    addVendor(...args: any[]): void;

    extendBuild(...args: any[]): void;

    extendRoutes(...args: any[]): void;

    ready(...args: any[]): Promise<void>;

    requireModule(...args: any[]): void;

}

export class Nuxt {
  [x: string]: any;
  options: any;
  
    constructor(...args: any[]);

    close(...args: any[]): void;

    ready(...args: any[]): void;

    static version: string;

}

export class Resolver {
    constructor(...args: any[]);

    requireModule(...args: any[]): void;

    resolveAlias(...args: any[]): void;

    resolveModule(...args: any[]): void;

    resolvePath(...args: any[]): void;

}
