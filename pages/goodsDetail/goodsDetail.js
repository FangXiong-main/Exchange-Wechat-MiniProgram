import { getGoodsDetailApi, toggleFavoriteApi, deleteGoodsApi, changeSaleStatusApi } from '../../api/goods.js'

Page({
  data: {
    id: null,
    name: '',
    price: '',
    detailInfo: '',
    images: '',
    saleStatus: 1,
    auditStatus: 0,
    rejectReason: '',
    username: '',
    avatarUrl: '',
    createTime: '',
    isLiked: 0, // 0未收藏 1已收藏
    imgList: [],
    loading: false,
    collectLoading: false, // 收藏防重复点击
    isMyGoods: false
  },

  onLoad(options) {
    const id = options.id
    if (!id) return
    this.setData({ id: id })
    this.getDetail()
  },

  async getDetail() {
    this.setData({ loading: true })
    try {
      const res = await getGoodsDetailApi(this.data.id)
      if (res.code !== 200) {
        wx.showToast({ title: res.msg || '加载失败', icon: 'none' })
        return
      }

      const g = res.data
      const imgList = g.images ? g.images.split(',') : []
      const loginUserId = wx.getStorageSync('userInfo')?.id || null

      this.setData({
        name: g.name,
        price: g.price,
        detailInfo: g.detailInfo,
        images: g.images,
        saleStatus: g.saleStatus,
        auditStatus: g.auditStatus,
        rejectReason: g.rejectReason,
        username: g.username,
        avatarUrl: g.avatarUrl,
        createTime: this.formatTime(g.createTime),
        isLiked: g.isLiked || 0,
        imgList: imgList,
        isMyGoods: loginUserId == g.userId,
      })
    } catch (err) {
      console.error(err)
    } finally {
      this.setData({ loading: false })
    }
  },

  // 收藏 / 取消收藏
  async toggleCollect() {
    const { isLiked, collectLoading } = this.data
    if (collectLoading) return
    // isLiked=1：取消收藏 type=0；isLiked=0：收藏 type=1
    const reqType = isLiked === 1 ? 0 : 1

    // 取消收藏：弹窗确认
    if (reqType === 0) {
      wx.showModal({
        title: '确认取消',
        content: '确定要取消收藏该商品吗？',
        success: async (res) => {
          if (!res.confirm) return
          await this.doCollectRequest(reqType)
        }
      })
      return
    }
    // 收藏直接请求
    await this.doCollectRequest(reqType)
  },

  // 执行收藏请求，传入type
  async doCollectRequest(type) {
    this.setData({ collectLoading: true })
    try {
      // 传参：商品id + type(1收藏/0取消)
      const res = await toggleFavoriteApi({ id: this.data.id, type })

      if (res.code === 200) {
        const newIsLiked = type === 1 ? 1 : 0
        const tip = newIsLiked === 1 ? '收藏成功' : '取消收藏成功'
        wx.showToast({ title: tip, icon: 'success' })
        this.setData({ isLiked: newIsLiked })
      } else {
        wx.showToast({ title: res.msg || '操作失败', icon: 'none' })
      }
    } catch (e) {
      wx.showToast({ title: '网络异常', icon: 'none' })
    } finally {
      this.setData({ collectLoading: false })
    }
  },

  buyGoods() {
    if (this.data.saleStatus !== 1) {
      wx.showToast({ title: '商品已下架', icon: 'none' })
      return
    }
  
    // 把当前商品所有信息带到确认订单页
    const goods = {
      id: this.data.id,
      name: this.data.name,
      price: this.data.price,
      avatarUrl: this.data.avatarUrl,
      username: this.data.username
    }
  
    wx.navigateTo({
      url: '/pages/createOrder/createOrder?goods=' + encodeURIComponent(JSON.stringify(goods))
    })
  },

  editGoods() {
    wx.navigateTo({ url: `/pages/goodsEdit/goodsEdit?id=${this.data.id}` })
  },

  async changeSaleStatus() {
    const { auditStatus } = this.data
    if (auditStatus === 0) {
      wx.showToast({ title: '待审核商品无法操作', icon: 'none' })
      return
    }

    const tip = this.data.saleStatus === 1 ? '确定要下架商品吗？' : '确定要上架商品吗？'

    wx.showModal({
      title: '提示',
      content: tip,
      success: async (res) => {
        if (!res.confirm) return
        this.setData({ loading: true })
        try {
          const newStatus = this.data.saleStatus === 1 ? 0 : 1
          const result = await changeSaleStatusApi({ id: this.data.id, saleStatus: newStatus })
          if (result.code === 200) {
            wx.showToast({ title: '操作成功' })
            await this.getDetail()
          } else {
            wx.showToast({ title: result.msg || '操作失败', icon: 'none' })
          }
        } catch (e) {
          wx.showToast({ title: '网络异常', icon: 'none' })
        } finally {
          this.setData({ loading: false })
        }
      }
    })
  },

  deleteGoods() {
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，是否继续？',
      success: async (res) => {
        if (!res.confirm) return
        this.setData({ loading: true })
        try {
          const result = await deleteGoodsApi(this.data.id)
          if (result.code === 200) {
            wx.showToast({ title: '删除成功' })
            setTimeout(() => wx.navigateBack(), 1000)
          } else {
            wx.showToast({ title: result.msg || '删除失败', icon: 'none' })
          }
        } catch (e) {
          wx.showToast({ title: '网络异常', icon: 'none' })
        } finally {
          this.setData({ loading: false })
        }
      }
    })
  },

  formatTime(time) {
    if (!time) return ''
    const date = new Date(time)
    const y = date.getFullYear()
    const m = (date.getMonth() + 1).toString().padStart(2, '0')
    const d = date.getDate().toString().padStart(2, '0')
    const hh = date.getHours().toString().padStart(2, '0')
    const mm = date.getMinutes().toString().padStart(2, '0')
    return `${y}-${m}-${d} ${hh}:${mm}`
  }
})