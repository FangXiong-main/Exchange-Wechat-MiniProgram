import { getMyFavoriteApi } from '../../api/goods.js'
import request from '../../utils/request.js' // 👈 加上

Page({
  data: {
    favoriteList: [],
    page: 1,
    pageSize: 10,
    loading: false,
    hasMore: true
  },

  onLoad() {
    this.getFavoriteList()
  },

  onPullDownRefresh() {
    this.setData({ page:1, favoriteList:[], hasMore:true })
    this.getFavoriteList(() => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    if (!this.data.hasMore || this.data.loading) return
    this.setData({ page: this.data.page + 1 })
    this.getFavoriteList()
  },

  async getFavoriteList(callback) {
    this.setData({ loading: true })
    const { page, pageSize } = this.data

    try {
      const res = await getMyFavoriteApi({ page, pageSize })
      console.log("收藏接口返回：", res)

      if (res.code !== 200) {
        wx.showToast({ title: res.msg || '加载失败', icon: 'none' })
        this.setData({ loading: false })
        return
      }

      const { total, rows } = res.data
      let newList = rows || []

      // ======================
      // ✅ 统一图片拼接规范（核心修改）
      // ======================
      newList = newList.map(item => {
        if (item.createTime) {
          item.createTime = this.formatTime(item.createTime)
        }

        // 拼接商品主图
        if (item.images) {
          let img = item.images.split(',')[0]
          if (img && !img.startsWith('http')) {
            item.mainImg = request.baseURL + img
          } else {
            item.mainImg = img
          }
        } else {
          item.mainImg = ''
        }

        return item
      })

      const finalList = page === 1 ? newList : [...this.data.favoriteList, ...newList]

      this.setData({
        favoriteList: finalList,
        hasMore: finalList.length < total,
        loading: false
      })

    } catch (err) {
      console.error(err)
      wx.showToast({ title: '网络异常', icon: 'none' })
      this.setData({ loading: false })
    }
    callback && callback()
  },

  formatTime(timeStr) {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hour = date.getHours().toString().padStart(2, '0')
    const minute = date.getMinutes().toString().padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${minute}`
  },

  goDetail(e) {
    wx.navigateTo({ url: '/pages/goodsDetail/goodsDetail?id=' + e.currentTarget.dataset.id })
  }
})