import * as moduleAlias from 'module-alias';
import path from 'path';

moduleAlias.addAliases({
    '@': path.resolve(__dirname),
    '@/config': path.resolve(__dirname, 'config'),
    '@/controllers': path.resolve(__dirname, 'controllers'),
    '@/middleware': path.resolve(__dirname, 'middleware'),
    '@/models': path.resolve(__dirname, 'models'),
    '@/routes': path.resolve(__dirname, 'routes'),
    '@/services': path.resolve(__dirname, 'services'),
    '@/repositories': path.resolve(__dirname, 'repositories'),
    '@/types': path.resolve(__dirname, 'types'),
    '@/utils': path.resolve(__dirname, 'utils'),
    '@/validations': path.resolve(__dirname, 'validations'),
});
// import moduleAlias from 'module-alias';
// import path from 'path';

// moduleAlias.addAliases({
//     '@': path.resolve(__dirname),
//     '@/config': path.resolve(__dirname, 'config'),
//     '@/controllers': path.resolve(__dirname, 'controllers'),
//     '@/middleware': path.resolve(__dirname, 'middleware'),
//     '@/models': path.resolve(__dirname, 'models'),
//     '@/routes': path.resolve(__dirname, 'routes'),
//     '@/services': path.resolve(__dirname, 'services'),
//     '@/repositories': path.resolve(__dirname, 'repositories'),
//     '@/types': path.resolve(__dirname, 'types'),
//     '@/utils': path.resolve(__dirname, 'utils'),
//     '@/validations': path.resolve(__dirname, 'validations'),
// });