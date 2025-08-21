import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import scss from 'rollup-plugin-scss';

const plugins = [nodeResolve()].concat(process.env.NO_MIN ? [] : [terser()]);

export default [
  {
    plugins,
    input: './src/file-tree.js',
    output: {
      esModule: true,
      file: `./prod.js`,
    }
  },
  {
    plugins: [
      scss({
        name: 'prod.css',
        fileName: 'prod.css',
        outputStyle: 'compressed'
      })
    ],
    input: './src/file-tree.css',
    output: {
      file: `./prod.css`,
    }
  }
];
