import { getMyOrderApi } from '../../api/order.js'
import request from '../../utils/request.js' // 👈 加上

Page({
  data: {
    orderList: [],
    page: 1,
    pageSize: 10,
    loading: false,
    hasMore: true
  },

  onLoad() {
    this.loadOrderList()
  },

  onPullDownRefresh() {
    this.setData({
      page: 1,
      orderList: [],
      hasMore: true
    })
    this.loadOrderList(() => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    if (!this.data.hasMore || this.data.loading) return
    this.setData({ page: this.data.page + 1 })
    this.loadOrderList()
  },

  async loadOrderList(callback) {
    this.setData({ loading: true })
    const { page, pageSize } = this.data

    try {
      const res = await getMyOrderApi({ page, pageSize })
      const { total, rows } = res.data

      let loginUserId = wx.getStorageSync('userInfo')?.id

      let newList = rows || []
      newList = newList.map(item => {
        item.createTime = this.formatTime(item.createTime)
        item.orderType = item.buyerId == loginUserId ? "buy" : "sell"

        // ======================
        // ✅ 订单商品图片统一拼接（核心修改）
        // ======================
        if (item.images) {
          let img = item.images.split(',')[0]
          if (img && !img.startsWith('http')) {
            item.goodsImg = request.baseURL + img
          } else {
            item.goodsImg = img
          }
        } else {
          item.goodsImg = ''
        }

        return item
      })

      const finalList = page === 1 ? newList : [...this.data.orderList, ...newList]

      this.setData({
        orderList: finalList,
        hasMore: finalList.length < total,
        loading: false
      })
    } catch (err) {
      console.error(err)
      this.setData({ loading: false })
      wx.showToast({ title: '加载失败', icon: 'none' })
    }

    callback && callback()
  },

  goOrderDetail(e) {
    const orderId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/orderDetail/orderDetail?id=' + orderId
    })
  },

  formatTime(timeStr) {
    if (!timeStr) return ""
    const date = new Date(timeStr)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const d = String(date.getDate()).padStart(0, '0')
    const h = String(date.getHours()).padStart(2, '0')
    const min = String(date.getMinutes()).padStart(2, '0')
    const sec = String(date.getSeconds()).padStart(2, '0')
    return `${y}-${m}-${d} ${h}:${min}:${sec}`
  }
})