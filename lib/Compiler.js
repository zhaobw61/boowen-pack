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
    buildModule(modulePath,isEntry){
        
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