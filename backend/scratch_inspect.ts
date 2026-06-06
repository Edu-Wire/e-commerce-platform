import app from './src/index';

function print(path: any, layer: any) {
  if (layer.route) {
    layer.route.stack.forEach(print.bind(null, path.concat(split(layer.route.path))));
  } else if (layer.name === 'router' && layer.handle.stack) {
    layer.handle.stack.forEach(print.bind(null, path.concat(split(layer.regexp))));
  } else if (layer.method) {
    const routePath = path.concat(split(layer.regexp)).filter(Boolean).join('/');
    if (routePath.includes('products')) {
      console.log('%s /%s', layer.method.toUpperCase(), routePath);
    }
  }
}

function split(thing: any) {
  if (typeof thing === 'string') {
    return thing.split('/');
  } else if (thing.fast_slash) {
    return '';
  } else {
    var match = thing.toString()
      .replace('\\/?', '')
      .replace('(?=\\/|$)', '$')
      .match(/^\/\^((?:\\[.*+?^${}()|[\]\\]|[^/^[\]\\$*+?{}|()]+)+)\$\//);
    return match
      ? match[1].replace(/\\(.)/g, '$1').split('/')
      : '<complex:' + thing.toString() + '>';
  }
}

console.log('--- REGISTERED PRODUCTS ROUTES ---');
app._router.stack.forEach(print.bind(null, []));
process.exit(0);
