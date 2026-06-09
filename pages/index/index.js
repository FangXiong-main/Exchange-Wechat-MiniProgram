import { getNewGoodsPage } from '../../api/goods.js'
import request from '../../utils/request.js'

Page({
  data: {
    searchKey: '',
    goodsList: [],
    loading: false,
    pageNum: 1,
    pageSize: 10,
    noMore: false,
    isFirstLoaded: false,
    fromDetail: false
  },

  onShow() {
    if (this.data.fromDetail) {
      this.setData({ fromDetail: false })
      return
    }
    if (!this.data.isFirstLoaded) {
      this.setData({ isFirstLoaded: true })
    }
    this.refreshData()
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ fromDetail: true })
    wx.navigateTo({ url: '/pages/goodsDetail/goodsDetail?id=' + id })
  },

  refreshData() {
    this.setData({
      pageNum: 1,
      goodsList: [],
      noMore: false,
      loading: true
    })
    this.getGoodsList(true)
  },

  onSearchInput(e) {
    this.setData({ searchKey: e.detail.value })
  },

  // ======================
  // 🔥 搜索：type 强制传 null
  // ======================
  doSearch() {
    const key = this.data.searchKey.trim()
    if (!key) {
      wx.showToast({ title: '请输入搜索内容', icon: 'none' })
      return
    }

    wx.navigateTo({
      url: `/pages/selectedGoods/selectedGoods?type=null&search=${encodeURIComponent(key)}`
    })
  },

  async getGoodsList(isRefresh = false) {
    const { pageNum, pageSize, goodsList } = this.data

    if (isRefresh) {
      this.setData({ loading: true })
    }

    try {
      const res = await getNewGoodsPage(pageNum, pageSize)
      if (res && res.code === 200 && res.data) {
        let newList = res.data.rows || []

        newList = newList.map(item => {
          item.timeStr = this.formatTime(item.createTime)

          if (item.images) {
            let img = item.images.split(',')[0]
            item.mainImg = this.fixImg(img)
          } else {
            item.mainImg = ''
          }

          if (item.avatarUrl) {
            item.avatarUrl = this.fixImg(item.avatarUrl)
          }
          return item
        })

        const finalList = isRefresh ? newList : [...goodsList, ...newList]

        this.setData({
          goodsList: finalList,
          noMore: newList.length < pageSize
        })
      }
    } catch (err) {
      console.error('获取商品失败', err)
    } finally {
      this.setData({ loading: false })
      wx.stopPullDownRefresh()
    }
  },

  fixImg(img) {
    if (!img) return ''
    if (img.startsWith('http')) return img
    return request.baseURL + img
  },

  formatTime(timeStr) {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    const h = String(date.getHours()).padStart(2, '0')
    const m = String(date.getMinutes()).padStart(2, '0')
    return `${h}:${m}`
  },

  onReachBottom() {
    const { loading, noMore, pageNum } = this.data
    if (loading || noMore) return
    this.setData({ pageNum: pageNum + 1 })
    this.getGoodsList(false)
  },

  // ======================
  // 🔥 分类点击：只传 type
  // ======================
  goType(e) {
    const type = e.currentTarget.dataset.type
    wx.navigateTo({
      url: `/pages/selectedGoods/selectedGoods?type=${type}`
    })
  },

  onPullDownRefresh() {
    this.refreshData()
  }
})