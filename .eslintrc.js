module.exports = {
    root          : true,
    parser        : 'babel-eslint',
    parserOptions : {
        sourceType : 'module'
    },
    //extends       : 'airbnb-base',
    // required to lint *.vue files
    plugins       : [
        'html'
    ],
    // check if imports actually resolve
    'settings'    : {
        'import/resolver' : {
            'webpack' : {
                'config' : 'build/webpack.base.conf.js'
            }
        }
    },
    // add your custom rules here
    'rules'       : {
        // don't require .vue extension when importing

        //'import/extensions'     : ['error', 'always', {
        //    'js'  : 'never',
        //    'vue' : 'never'
        //}],
        //'no-unused-vars'        : 0,
        //'indent'                : 0,
        //'global-require'        : 0,
        //'func-names'            : 0,
        //'no-console'            : 0,
        //'object-shorthand'      : 0,
        //'key-spacing'           : 0,
        //'prefer-default-export' : 0,

        // allow debugger during development

        //'no-debugger'           : process.env.NODE_ENV === 'production' ? 2 : 0
    }
}
