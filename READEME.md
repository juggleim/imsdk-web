### 环境要求

1、编译环境要求 node.js `16.20.2+`

2、执行命令 `npm release` 编译全部版本

3、`dist` 目录选择环境所需 SDK 文件拷贝至项目中使用


### 浏览器兼容性



### 其他

`npx pbjs -t json-module -w es6 -o proto.js connect.proto`

`import $protobuf from "../3rd/protobuf";`