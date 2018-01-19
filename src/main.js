// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import VueI18n from 'vue-i18n'

Vue.config.productionTip = false
Vue.use(VueI18n)

const shared = {
  isZh: /zh/.test(window.navigator.language)
}

const translations = {
  zh: {
    home: {
      title: '比特币现金支付测试',
      usage: '使用：向本页面地址发送小额 BCH，该金额（扣除约 2 bit 矿工费）会在几秒内原路返还给你',
      ad: '广告位',
      successfullyReturned: '成功返还',
      txCountUnit: '笔',
      totalValue: '共计',
      copyAddr: '复制地址',
      copied: '已复制',
      useCashAddr: '使用新版地址',
      openInBlockExplorer: '在区块链浏览器上查看',
      waitingForTransaction: '等待支付中...',
      newTransaction: '有新的交易，金额已返还',
      about: '关于',
      aboutTitle: '联系/捐赠开发者(BCH)',
      mobile: '电话&微信',
      email: '邮箱',
      sourceCode: '开放源码',
      inspiredBy: '灵感来自'
    }
  },
  en: {
    home: {
      title: 'Bitcoin Cash Echo Test',
      usage: 'Usage: send BCH to address in this page, The amount (less miner fees of about 2 bit) will sent back to you in the next few seconds.',
      ad: 'Ad',
      successfullyReturned: 'Successfully returned',
      txCountUnit: 'txs',
      totalValue: 'Total value',
      copyAddr: 'Copy address',
      copied: 'Copied',
      useCashAddr: 'Use CashAddr',
      openInBlockExplorer: 'Open in block explorer',
      waitingForTransaction: 'Waiting for transaction',
      newTransaction: 'New transaction success',
      about: 'About',
      aboutTitle: 'Donate to the developer (BCH)',
      mobile: 'Mobile&Wechat',
      email: 'Email',
      sourceCode: 'Source Code',
      inspiredBy: 'Inspired by'
    }
  }
}

const i18n = new VueI18n({
  locale: shared.isZh ? 'zh' : 'en',
  messages: translations
})
/* eslint-disable no-new */
new Vue({
  el: '#app',
  data: {
    shared
  },
  router,
  i18n,
  template: '<App/>',
  components: { App }
})
