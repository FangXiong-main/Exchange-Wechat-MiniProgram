import { getUserBalanceApi, getUserEXCWalletList } from '../../api/user.js'

Page({
  data: {
    balanceText: '查询中...',
    detailList: [],
    page: 1,
    pageSize: 10,
    hasMore: true,
    detailLoading: false,
    typeMap: {
      1: '消费',
      2: '收入',
      3: '退款',
      4: '充值',
      5: '平台扣费'
    }
  },

  onLoad() {
    this.loadBalance()
    this.loadDetail()
  },

  onPullDownRefresh() {
    this.setData({
      page: 1,
      hasMore: true,
      detailList: []
    })
    Promise.all([this.loadBalance(), this.loadDetail()])
      .finally(() => wx.stopPullDownRefresh())
  },

  onReachBottom() {
    if (!this.data.hasMore || this.data.detailLoading) return
    this.setData({ page: this.data.page + 1 })
    this.loadDetail()
  },

  async loadBalance() {
    try {
      const res = await getUserBalanceApi()
      if (res.code === 200) {
        this.setData({ balanceText: res.data })
      } else {
        this.setData({ balanceText: "获取失败" })
      }
    } catch (e) {
      this.setData({ balanceText: "获取失败" })
    }
  },

  async loadDetail() {
    const { page, pageSize, detailList } = this.data
    this.setData({ detailLoading: true })

    try {
      
      const res = await getUserEXCWalletList(page, pageSize)

      if (res.code !== 200) throw new Error("获取失败")

      const { total, rows } = res.data
      let arr = rows || []

      arr = arr.map(item => {
        item.createTime = this.formatTime(item.createTime)
        return item
      })

      const newArr = page === 1 ? arr : [...detailList, ...arr]

      this.setData({
        detailList: newArr,
        hasMore: newArr.length < total,
        detailLoading: false
      })
    } catch (err) {
      console.error(err)
      this.setData({ detailLoading: false })
    }
  },

  formatTime(timeStr) {
    if (!timeStr) return ''
    const d = new Date(timeStr)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const h = String(d.getHours()).padStart(2, '0')
    const min = String(d.getMinutes()).padStart(2, '0')
    return `${y}-${m}-${day} ${h}:${min}`
  }
})