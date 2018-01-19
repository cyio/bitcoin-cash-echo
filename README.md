# bitcoin-cash-echo

线上访问：[Bitcoin Cash echo](http://bch-echo.leanapp.cn/)

## 说明

## 开发

安装依赖，在项目根目录下，**注意不要用 yarn 安装**
```sh
npm install
```
复制一份配置
`$ cp private-config.json.template private-config.json`
`private_key` // 用于接收资金的钱包私钥，必填
```json
{
	"private_key": ""
}
```
本地开发启动后端
```sh
lean up --port 8083
```
或者不使用 leancloud
```sh
npm run dev
```
启动前端
```sh
npm run dev:web
```

## 部署
```sh
npm run build
lean deploy
```
