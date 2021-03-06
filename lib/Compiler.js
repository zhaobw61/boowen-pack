let fs = require('fs');
let path = require('path');
let babylon = require('babylon');
let t = require('@babel/types');
let traverse = require('@babel/traverse').default;
let generator = require('@babel/generator').default;
let ejs = require('ejs');
let {SyncHook} =  require('tapable');
// babylon 主要是把源码转换成ast
// @babel/traverse
// @babel/types
// @babel/generator
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
        this.hook = {
            entryOption:new SyncHook(),
            compile:new SyncHook(),
            afterCompiler:new SyncHook(),
            afterPulgins:new SyncHook(),
            run:new SyncHook(),
            emit:new SyncHook(),
            done:new SyncHook()
        }
        // 如果传递了plugin参数
        let plugins = this.config.plugins;
        if(Array.isArray(plugins)){
            plugins.forEach(plugins => {
                plugins.apply(this);
            });
        }
        this.hooks.afterPulgins.call();
    }
    // 解析源码
    parse(source,parentPath){ //AST解析语法树
        let ast = babylon.parse(source);
        let dependencies = []; // 依赖数组
        traverse(ast,{
            CallExpression(p){
                let node = p.node;
                if(node.callee.name === 'require'){
                    node.callee.name = '__webpack_require__'; // 把require替换成__webpack_require__
                    let moduleName = node.arguments[0].value;
                    moduleName = moduleName + (path.extname(moduleName)?'':'.js');
                    moduleName = './' + path.join(parentPath,moduleName);
                    dependencies.push(moduleName);  //存储依赖
                    node.arguments = [t.stringLiteral(moduleName)]
                }
            }
        });
        let sourceCode = generator(ast).code;
        return {sourceCode,dependencies};
    }
    getSource(modulePath){
        let rules = this.config.module.rules;
        let content = fs.readFileSync(modulePath,'utf8');
        // 拿到每个规则来处理
        for(let i = 0;i<rules.length;i++){
            let rule = rules[i];
            let {test,use} = rule;
            let len = use.length - 1;
            if(test.test(modulePath)){
                function normalLoader(){
                    let loader = require(ues[len--]);
                    content = loader(content);
                    if(len > 0){
                        normalLoader();
                    }
                }
               
            }
        }
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

        dependencies.forEach(dep=>{ // 父模块的附属 递归加载
            this.buildModule(path.join(this.root,dep),false);
        })
    }
    emitFile(){
        // 用数据渲染
        // 拿到输出到哪个目录下
        let main = path.join(this.config.output.path,this.config.output.filename);
        let templateStr = this.getSource(path.join(__dirname,'main.ejs'));
        let code = ejs.render(templateStr,{entryId:this.entryId,modules:this.modules});
        this.assets = {};
        // 资源中 路径对应代码
        this.assets[main] = code;
        fs.writeFileSync(main,this.assets[main]);
    }
    run(){
        this.hooks.run.call();
        // 执行 并且创建模块的依赖关系
        this.hooks.compile.call();
        this.buildModule(path.resolve(this.root,this.entry),true);
        this.hooks.afterCompile.call();
        // 发射一个文件 打包后的文件
        this.emitFile();
        this.hooks.emit.call();
        this.hooks.done.call();
    }
}
module.exports = Compiler;