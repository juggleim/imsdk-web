import babel from 'rollup-plugin-babel';
import minify from 'rollup-plugin-babel-minify';
import utils from '../src/utils';

const {version} = require('../package.json');
const fullYear = new Date().getFullYear();

const banner = [
  '/*', 
  `* Juggle.js v${version}`, 
  `* (c) 2022-${fullYear} Juggle`,
  '* Released under the MIT License.',
  '*/'].join('\n');

const getTarget = function(type){
  type = type || '';
  return `dist/juggle.${version}${type}.js`;
};

const genConfig = function(type){
  return {
    input: 'src/index.js',
    output: {
      file: getTarget(type),
      format: 'umd',
      name: 'Juggle',
    },
    plugins: [ 
      babel({
        exclude: 'node_modules/**'
      })
    ]
  }
};

const configs = {
  min: () => {
    let config = genConfig('.min');
    return utils.extend(config, {
      plugins: [ 
        minify({
          banner,
          removeConsole: true,
          simplifyComparisons: false
        }),
        babel({
          exclude: 'node_modules/**'
        })
      ]
    })
  },
  dev: () => {
    let config = genConfig('.dev');
    utils.extend(config.output, {
      banner
    });
    return config;
  },
  es: () => {
    let config = genConfig('.es');
    const format = 'es';
    utils.extend(config.output, {
      banner,
      format
    });
    return config;
  }
};

module.exports = configs[process.env.TAG]()