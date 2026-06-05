import { getMyPublishApi } from '../../api/user.js'
import request from '../../utils/request.js' // 👈 加上

Page({
  data: {
    goodsList: [],
    page: 1,
    pageSize: 10,
    loading: false,
    hasMore: true
  },

  onShow() {
    this.refreshList()
  },

  onPullDownRefresh() {
    this.refreshList()
  },

  onReachBottom() {
    this.loadMore()
  },

  async refreshList() {
    this.setData({ page: 1, goodsList: [], hasMore: true })
    await this.loadData()
    wx.stopPullDownRefresh()
  },

  async loadMore() {
    if (!this.data.hasMore || this.data.loading) return
    this.setData({ page: this.data.page + 1 })
    await this.loadData()
  },

  async loadData() {
    this.setData({ loading: true })
    try {
      const { page, pageSize } = this.data
      const res = await getMyPublishApi({ page, pageSize })

      if (res.code !== 200) {
        wx.showToast({ title: res.msg || '加载失败', icon: 'none' })
        this.setData({ loading: false })
        return
      }

      const { total, rows } = res.data
      let newList = rows || []

      // ======================
      // ✅ 统一拼接图片地址
      // ======================
      newList = newList.map(item => {
        if (item.createTime) {
          item.createTime = this.formatTime(item.createTime)
        }

        // 图片拼接完整URL
        if (item.images) {
          let img = item.images.split(',')[0]
          // 拼接，防止重复拼接
          if (img && !img.startsWith('http')) {
            item.mainImg = request.baseURL + img
          } else {
            item.mainImg = img
          }
        } else {
          item.mainImg = ""
        }

        return item
      })

      const finalList = page === 1 ? newList : [...this.data.goodsList, ...newList]

      this.setData({
        goodsList: finalList,
        hasMore: finalList.length < total,
        loading: false
      })

    } catch (err) {
      console.error(err)
      this.setData({ loading: false })
      wx.showToast({ title: "加载失败", icon: "none" })
    }
  },

  formatTime(timeStr) {
    if (!timeStr) return ""
    const date = new Date(timeStr)
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const hour = date.getHours().toString().padStart(2, '0')
    const min = date.getMinutes().toString().padStart(2, '0')
    return `${year}-${month}-${day} ${hour}:${min}`
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: '/pages/goodsDetail/goodsDetail?id=' + id
    })
  }
})