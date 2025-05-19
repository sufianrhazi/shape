import { plugin } from '@srhazi/gooey-vite-plugin';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
    build: {
        target: 'es2020',
    },
    esbuild: {
        target: 'es2020',
        define: {
            LIB_VERSION: '"test"',
        },
    },
    plugins: [plugin()],
});
