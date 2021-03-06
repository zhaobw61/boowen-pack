#! /usr/bin/env node

// 1.需要找到当前在执行名的路径，拿到webpack.js

let path = require('path');

 // config 配置文件

 let config = require(path.resolve('webpack.config.js'));

 let Compiler = require('../lib/Compiler.js');
 let compiler = new Compiler(config);
 compiler.hooks.entryOption.call();
//  表示运行
 compiler.run();