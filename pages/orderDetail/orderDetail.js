import { getOrderDetailApi, cancelOrderApi, confirmOrderApi, deleteOrderApi } from '../../api/order.js'

Page({
  data: {
    loading: true,

    id: null,
    goodsId: null,
    buyerId: null,
    sellerId: null,
    status: null,
    payType: null,
    payTime: '',
    finishTime: '',
    createTime: '',
    updateTime: '',

    goodsName: '',
    goodsPrice: '',
    goodsImage: '',
    goodsDetail: '',
    sellerName: '',

    statusText: '',
    statusDesc: '',
    showOperate: true,
    isBuyer: false,
    isSeller: false
  },

  onLoad(options) {
    const orderId = options.id
    if (!orderId) return
    this.setData({ id: orderId })
    this.getDetail()
  },

  async getDetail() {
    this.setData({ loading: true })
    try {
      const res = await getOrderDetailApi(this.data.id)
      if (res.code !== 200) {
        wx.showToast({ title: '加载失败', icon: 'none' })
        return
      }

      const order = res.data
      const loginUserId = wx.getStorageSync('userInfo')?.id || null
      const isBuyer = loginUserId == order.buyerId
      const isSeller = loginUserId == order.sellerId

      let statusText = ''
      let statusDesc = ''

      if (order.status === 1) {
        statusText = '等待双方面交'
        if (isSeller) {
          statusDesc = '买家已付款，请您尽快按照约定与买家交货'
        } else if (isBuyer) {
          statusDesc = '等待卖家联系您交货'
        }
      } else if (order.status === 2) {
        statusText = '卖家已确认面交'
        if (isSeller) {
          statusDesc = '等待买家确认面交'
        } else if (isBuyer) {
          statusDesc = '如果您已完成面交，请尽快确认已面交'
        }
      } else if (order.status === 3) {
        statusText = '订单已取消'
        statusDesc = '期待您的下次使用'
      } else if (order.status === 4) {
        statusText = '交易完成'
        statusDesc = 'Exchanged！期待您的下次使用！'
      }

      order.createTime = this.formatTime(order.createTime)
      if (order.payTime) order.payTime = this.formatTime(order.payTime)
      if (order.finishTime) order.finishTime = this.formatTime(order.finishTime)

      this.setData({
        ...order,
        goodsPrice: String(order.goodsPrice),
        statusText,
        statusDesc,
        isBuyer,
        isSeller,
        showOperate: true,
        loading: false
      })

    } catch (err) {
      console.error(err)
      this.setData({ loading: false })
    }
  },

  // 取消订单
  async cancelOrder() {
    wx.showModal({
      title: '确认取消',
      content: '确定取消该订单？',
      success: async (r) => {
        if (!r.confirm) return
        const res = await cancelOrderApi(this.data.id)
        if (res.code === 200) {
          wx.showToast({ title: '取消成功' })
          this.getDetail()
        } else {
          wx.showModal({ title: '提示', content: res.msg || '操作失败', showCancel: false })
        }
      }
    })
  },

  // 确认面交
  async confirmOrder() {
    wx.showModal({
      title: '确认面交',
      content: '确认已完成当面交易？',
      success: async (r) => {
        if (!r.confirm) return
        const res = await confirmOrderApi(this.data.id)
        if (res.code === 200) {
          wx.showToast({ title: '确认成功' })
          this.getDetail()
        } else {
          wx.showModal({ title: '提示', content: res.msg || '操作失败', showCancel: false })
        }
      }
    })
  },

  // 删除订单
  async deleteOrder() {
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复',
      success: async (r) => {
        if (!r.confirm) return
        const res = await deleteOrderApi(this.data.id)
        if (res.code === 200) {
          wx.showToast({ title: '删除成功' })
          wx.navigateBack()
        } else {
          wx.showModal({ title: '提示', content: res.msg || '删除失败', showCancel: false })
        }
      }
    })
  },

  formatTime(timeStr) {
    if (!timeStr) return ""
    const date = new Date(timeStr)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(2, '0')
    const h = String(date.getHours()).padStart(2, '0')
    const min = String(date.getMinutes()).padStart(2, '0')
    const sec = String(date.getSeconds()).padStart(2, '0')
    return `${y}-${m}-${d} ${h}:${min}:${sec}`
  },

  goGoodsDetail() {
    wx.navigateTo({ url: '/pages/goodsDetail/goodsDetail?id=' + this.data.goodsId })
  }
})