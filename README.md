# bitcoin-cash-echo

## What
This website will automatically return the amount you sent, for testing purposes only.

## Features

* client only, create new HDwallet for every user, mnemonic only saves on browser storage.
* support mainnet and testnet
* support legacy and cashAddress
* English and Chinese language support 

Inspired by [Bitcoin Cash Hotwallet Echo Test by Rick Falkvinge](http://sandbox.swarmops.com/Admin/BitcoinEchoTest)

## Rewite
The old version uses bitcore.js to create a single wallet. It has a backend because of cors issue. 

This new version uses [BITBOX](https://github.com/bigearth/bitbox-cli) to rewrite, and has no server.

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload
npm run dev

# build for production with minification
npm run build
```
