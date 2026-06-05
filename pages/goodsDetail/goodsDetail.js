import { getGoodsDetailApi, toggleFavoriteApi, deleteGoodsApi, changeSaleStatusApi } from '../../api/goods.js'
import request from '../../utils/request.js' // 👈 加上

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
    isLiked: 0,
    imgList: [],
    loading: false,
    collectLoading: false,
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
      const loginUserId = wx.getStorageSync('userInfo')?.id || null

      // ======================
      // ✅ 图片统一拼接（核心）
      // ======================
      let imgList = g.images ? g.images.split(',') : []
      imgList = imgList.map(img => {
        if (img && !img.startsWith('http')) {
          return request.baseURL + img
        }
        return img
      })

      // 头像也拼接
      let avatar = g.avatarUrl || ''
      if (avatar && !avatar.startsWith('http')) {
        avatar = request.baseURL + avatar
      }

      this.setData({
        name: g.name,
        price: g.price,
        detailInfo: g.detailInfo,
        images: g.images,
        saleStatus: g.saleStatus,
        auditStatus: g.auditStatus,
        rejectReason: g.rejectReason,
        username: g.username,
        avatarUrl: avatar, // 👈 已拼接
        createTime: this.formatTime(g.createTime),
        isLiked: g.isLiked || 0,
        imgList: imgList, // 👈 已全部拼接
        isMyGoods: loginUserId == g.userId,
      })
    } catch (err) {
      console.error(err)
    } finally {
      this.setData({ loading: false })
    }
  },

  async toggleCollect() {
    const { isLiked, collectLoading } = this.data
    if (collectLoading) return
    const reqType = isLiked === 1 ? 0 : 1

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
    await this.doCollectRequest(reqType)
  },

  async doCollectRequest(type) {
    this.setData({ collectLoading: true })
    try {
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