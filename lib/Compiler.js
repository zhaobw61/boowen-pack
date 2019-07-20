let fs = require('fs');
let path = require('path');
class Compiler{
    constructor(config){
        this.config = config;
        // 需要保存入口文件的路径
        this.entryId; // './serc/index.js'
        // 需要保存所有的模块依赖
        this.modules = {};
        this.entry = config.entry;
        // 工作路径
        this.root = process.cwd();
    }
    // 解析源码
    parse(source,parentPath){ //AST解析语法树

    }
    getSource(modulePath){
        let content = fs.readFileSync(modulePath,'utf8');
        return content;
    }
    buildModule(modulePath,isEntry){
        // 拿到模块内容
        let source = this.getSource(modulePath);
        // 模块ID
        let moduleName = './'+path.relative(this.root,modulePath);

        if(this.isEntry){
            this.entryId = moduleName; // 保存入口的名字
        }

        // 解析需要把source源码进行改造 返回一个依赖列表
        let {sourceCode,dependencies} = this.parse(source,path.dirname(moduleName));
        // 把相对路径和模块中的内容 对应起来
        this.modules[moduleName] = sourceCode;
    }
    emitFile(){

    }
    run(){
        // 执行 并且创建模块的依赖关系
        this.buildModule(path.resolve(this.root,this.entry),true);
        // 发射一个文件 打包后的文件
        this.emitFile();
    }
}
module.exports = Compiler;