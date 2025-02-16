import { defineConfig } from 'vite';
import { resolve, basename, extname } from 'path';
import { main, name } from './package.json';

const fileName = `${basename(main, extname(main))}.js`;

// Plugin to add the Access-Control-Allow-Private-Network header to preflight responses
function privateNetworkAllowPlugin() {
  return {
    name: 'vite-plugin-private-network-allow',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        // Check if this is a preflight (OPTIONS) request and the browser indicates a private network request.
        if (
          req.method === 'OPTIONS' &&
          req.headers['access-control-request-private-network'] !== undefined
        ) {
          res.setHeader('Access-Control-Allow-Private-Network', 'true');
        }
        next();
      });
    },
  };
}

function serveLibraryPlugin() {
  return {
    name: 'serve-library-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const normalizedUrl = req.url.split('?')[0];
        if (normalizedUrl === `/${fileName}`) {
          const result = await server.transformRequest(`/${main}`);
          if (result) {
            res.setHeader('Content-Type', 'application/javascript');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(result.code);
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  server: {
    cors: true, // Enable CORS so that your Home Assistant instance can load your script.
  },
  plugins: [privateNetworkAllowPlugin(), serveLibraryPlugin()],
  build: {
    target: 'es2022',
    lib: {
      entry: resolve(__dirname, main),
      name,
      formats: ['es'],
      fileName,
    },
    outDir: 'dist',
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        format: 'es',
        entryFileNames: '[name].js',
        chunkFileNames: '[name].[hash].js',
      },
    },
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true,
    },
  },
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        experimentalDecorators: true,
        useDefineForClassFields: false, // enable legacy decorator behavior
      },
    },
  },
});
