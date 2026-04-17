// Narrow ambient declaration for `process.env.NODE_ENV` lookups inside the
// SDK. The bundler (tsup/esbuild) replaces `process.env.NODE_ENV` with a
// string literal at build time, so the property exists at runtime without
// a real `process` object. This declaration gives tsc just enough shape to
// typecheck those references without pulling in `@types/node`, which would
// expose Node-only APIs that have no browser runtime.
declare const process: {
  env: {
    NODE_ENV?: 'development' | 'production' | 'test';
  };
};
