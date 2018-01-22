# bitcoin-cash-echo

Online：[Bitcoin Cash echo](http://bch-echo.leanapp.cn/)

## Development

install dependency, **notice don't use yarn **, because of [Fail To complete transaction · Issue #188 · bitpay/bitcore-lib](https://github.com/bitpay/bitcore-lib/issues/188)
```sh
npm install
```
copy a setting file from the template
`$ cp private-config.json.template private-config.json`
`private_key` // hot wallet to receive funds and send transactions
```json
{
	"private_key": ""
}
```
run backend
```sh
lean up
# or not use leancloud
npm run dev
```
run frontend
```sh
npm run dev:web
```

## Deploy
```sh
# build frontend
npm run build
lean deploy
# or not use leancloud
npm run start
```
