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
    fromDetail: false // 标记是否从详情页返回
  },

  onShow() {
    // 🔥 从详情页返回 → 不刷新
    if (this.data.fromDetail) {
      this.setData({ fromDetail: false })
      return
    }
    // 否则正常刷新
    if (!this.data.isFirstLoaded) {
      this.setData({ isFirstLoaded: true })
    }
    this.refreshData()
  },

  // 进入详情页时标记
  goDetail(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ fromDetail: true }) // 🔥 关键
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

  doSearch() {
    this.refreshData()
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

  goType(e) {
    const type = e.currentTarget.dataset.type
    wx.setStorageSync('goodsType', Number(type))
    wx.navigateTo({ url: '/pages/goodsList/goodsList' })
  },

  onPullDownRefresh() {
    this.refreshData()
  }
})