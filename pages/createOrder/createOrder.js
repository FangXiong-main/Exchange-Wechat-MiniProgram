import { createOrderApi } from '../../api/order.js'
import {getUserBalanceApi} from '../../api/user'

Page({
  data: {
    goods: null,
    loading: false,
    balanceText: '正在查询中...',
    selectedPayType: '', 
    userBalance: 0
  },

  onLoad(options) {
    try {
      const goodsStr = decodeURIComponent(options.goods || '')
      const goods = JSON.parse(goodsStr)
      this.setData({
        goods: goods || {}
      })
      
      this.setData({ selectedPayType: 'EXC_WALLET' })
      this.getUserBalance()
    } catch (e) {
      wx.showToast({ title: '数据异常', icon: 'none' })
    }
  },

  async getUserBalance() {
    try {
      const res = await getUserBalanceApi()
      if (res.code === 200) {
        const balance = res.data
        this.setData({
          balanceText: '余额：¥' + balance,
          userBalance: Number(balance)
        })
      } else {
        this.setData({ balanceText: '余额：查询失败' })
      }
    } catch (e) {
      this.setData({ balanceText: '余额：查询异常' })
    }
  },

  // 通用选择方法
  selectPayType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({ selectedPayType: type })
  },

  cancelBuy() {
    wx.showModal({
      title: '取消购买',
      content: '确定要放弃购买吗？',
      success: (res) => {
        if (res.confirm) wx.navigateBack()
      }
    })
  },

  // 通用提交：自动把 payType 转成后端需要的数字
  async confirmBuy() {
    const { goods, loading, selectedPayType, userBalance } = this.data

    if (loading || !goods?.id) {
      wx.showToast({ title: '数据异常', icon: 'none' })
      return
    }

    if (!selectedPayType) {
      wx.showToast({ title: '请选择支付方式', icon: 'none' })
      return
    }


    const payTypeMap = {
      'EXC_WALLET': 1
    }
    const payType = payTypeMap[selectedPayType]

    if (!payType) {
      wx.showToast({ title: '支付方式不支持', icon: 'none' })
      return
    }

    // 余额判断
    const goodsPrice = Number(goods.price)
    if (userBalance < goodsPrice) {
      wx.showToast({ title: '余额不足', icon: 'none' })
      return
    }

    this.setData({ loading: true })

    try {
      const res = await createOrderApi({
        goodsId: goods.id,
        payType: payType // 通用传值
      })

      if (res.code === 200) {
        wx.showToast({ title: '下单成功' })
        setTimeout(() => {
          wx.redirectTo({
            url: '/pages/orderDetail/orderDetail?id=' + res.data
          })
        }, 1000)
      } else {
        wx.showModal({
          title: '购买失败',
          content: res.msg || '下单失败',
          showCancel: false
        })
      }
    } catch (err) {
      wx.showModal({ title: '网络异常', showCancel: false })
    } finally {
      this.setData({ loading: false })
    }
  }
})