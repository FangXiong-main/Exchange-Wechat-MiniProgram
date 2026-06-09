import { getGoodsListByTypeOrSearchApi } from '../../api/goods.js'
import request from '../../utils/request.js'

Page({
  data: {
    searchKey: '',
    goodsList: [],
    loading: false,
    pageNum: 1,
    pageSize: 10,
    noMore: false,
    type: null,
    pageTitle: '商品列表',
    emptyTip: '暂无相关商品',
    fromDetail: false
  },

  onLoad(options) {
    // 接收参数
    let type = options.type
    let search = options.search ? decodeURIComponent(options.search) : ''

    // 处理 type = null
    if (type === 'null' || type === 'undefined' || !type) {
      type = null
    } else {
      type = Number(type)
    }

    const typeMap = {
      1: '书籍',
      2: '数码',
      3: '服饰',
      4: '电器',
      5: '其他'
    }

    let pageTitle = '商品列表'
    let emptyTip = '暂无相关商品'

    if (type) {
      pageTitle = typeMap[type] || '商品分类'
      emptyTip = `暂无${typeMap[type]}商品`
    } else if (search) {
      pageTitle = `搜索结果：${search}`
      emptyTip = `未找到“${search}”相关商品`
    }

    this.setData({
      type,
      searchKey: search,
      pageTitle,
      emptyTip
    })
  },

  onShow() {
    if (this.data.fromDetail) {
      this.setData({ fromDetail: false })
      return
    }
    this.refreshData()
  },

  refreshData() {
    this.setData({
      pageNum: 1,
      goodsList: [],
      noMore: false,
      loading: true
    })
    this.getList(true)
  },

  async getList(isRefresh) {
    const { pageNum, pageSize, type, searchKey, goodsList } = this.data
    try {
      const res = await getGoodsListByTypeOrSearchApi({
        pageNum,
        pageSize,
        type,
        name: searchKey
      })

      if (res.code === 200 && res.data) {
        let newList = (res.data.rows || []).map(item => {
          item.timeStr = this.formatTime(item.createTime)
          if (item.images) {
            const first = item.images.split(',')[0]
            item.mainImg = this.fixImg(first)
          }
          if (item.avatarUrl) {
            item.avatarUrl = this.fixImg(item.avatarUrl)
          }
          return item
        })

        this.setData({
          goodsList: isRefresh ? newList : [...goodsList, ...newList],
          noMore: newList.length < pageSize
        })
      }
    } catch (err) {
      console.error('加载失败', err)
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
    const d = new Date(timeStr)
    const h = String(d.getHours()).padStart(2, '0')
    const m = String(d.getMinutes()).padStart(2, '0')
    return `${h}:${m}`
  },

  onReachBottom() {
    if (this.data.loading || this.data.noMore) return
    this.setData({ pageNum: this.data.pageNum + 1 })
    this.getList(false)
  },

  onPullDownRefresh() {
    this.refreshData()
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id
    this.setData({ fromDetail: true })
    wx.navigateTo({ url: '/pages/goodsDetail/goodsDetail?id=' + id })
  }
})