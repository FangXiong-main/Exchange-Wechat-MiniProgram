import { getNewGoodsPage } from '../../api/goods.js'

Page({
  data: {
    searchKey: '',
    goodsList: [],
    loading: false,
    pageNum: 1,
    pageSize: 10,
    noMore: false,
    isFirstLoaded: false // 只控制首次进入
  },

  // 🔥 只在第一次进入时刷新，后退不刷新
  onShow() {
    if (!this.data.isFirstLoaded) {
      this.setData({ isFirstLoaded: true })
      this.refreshData()
    }
  },

  // 下拉刷新
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

  // 获取商品（支持追加模式）
  async getGoodsList(isRefresh = false) {
    const { pageNum, pageSize, goodsList } = this.data

    if (isRefresh) {
      this.setData({ loading: true })
    }

    try {
      const res = await getNewGoodsPage(pageNum, pageSize)
      if (res && res.code === 200 && res.data) {
        let newList = res.data.rows || []

        // 格式化时间
        newList = newList.map(item => {
          item.timeStr = this.formatTime(item.createTime)
          return item
        })

        // 🔥 下拉刷新 = 清空重加载；上拉加载 = 追加
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

  formatTime(timeStr) {
    if (!timeStr) return ''
    const date = new Date(timeStr)
    const h = String(date.getHours()).padStart(2, '0')
    const m = String(date.getMinutes()).padStart(2, '0')
    return `${h}:${m}`
  },

  // 🔥 上拉加载更多 → 完全正常
  onReachBottom() {
    const { loading, noMore, pageNum } = this.data
    if (loading || noMore) return

    this.setData({
      pageNum: pageNum + 1
    })
    this.getGoodsList(false)
  },

  goType(e) {
    const type = e.currentTarget.dataset.type
    wx.setStorageSync('goodsType', Number(type))
    wx.navigateTo({ url: '/pages/goodsList/goodsList' })
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: '/pages/goodsDetail/goodsDetail?id=' + id })
  },

  onPullDownRefresh() {
    this.refreshData()
  }
})