import { getGoodsDetailApi, updateGoodsApi } from '../../api/goods.js'

Page({
  data: {
    loading: true,
    id: null,
    name: '',
    price: '',
    images: '',
    detailInfo: '',
    type: 1, // 传给后端的值：1书籍 2数码 3服饰 4电器 5其他
    typeIndex: 0, // picker 下标（0~4）
    typeList: ['书籍','数码','服饰','电器','其他']
  },

  onLoad(options) {
    const goodsId = options.id
    if (!goodsId) return
    this.setData({ id: goodsId })
    this.getGoodsInfo()
  },

  // 获取商品详情
  async getGoodsInfo() {
    this.setData({ loading: true })
    try {
      const res = await getGoodsDetailApi(this.data.id)
      if (res.code !== 200) {
        wx.showToast({ title: '数据加载失败', icon: 'none' })
        this.setData({ loading: false })
        return
      }
      const info = res.data
      // 后端type(1-5) 转 picker下标(0-4)，默认兜底为0
      let index = (info.type || 1) - 1
      index = Math.max(0, Math.min(4, index))
      this.setData({
        name: info.name || '',
        price: info.price || '',
        images: info.images || '',
        detailInfo: info.detailInfo || '',
        type: info.type || 1,
        typeIndex: index,
        loading: false
      })
    } catch (err) {
      console.error(err)
      this.setData({ loading: false })
      wx.showToast({ title: '请求异常', icon: 'none' })
    }
  },

  // 商品名称输入
  inputName(e) {
    this.setData({ name: e.detail.value })
  },

  // 价格输入
  inputPrice(e) {
    this.setData({ price: e.detail.value })
  },

  // 描述输入
  inputDesc(e) {
    this.setData({ detailInfo: e.detail.value })
  },

  // 切换商品类型
  changeType(e) {
    const idx = Number(e.detail.value)
    this.setData({
      typeIndex: idx,
      type: idx + 1 // 下标转后端数字 1-5
    })
  },

  // 选择图片
  chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempPath = res.tempFilePaths[0]
        this.setData({ images: tempPath })
      }
    })
  },

  // 保存修改
  async saveGoods() {
    const { id, name, price, images, detailInfo, type } = this.data
    if (!name) {
      wx.showToast({ title: '请输入商品名称', icon: 'none' })
      return
    }
    if (!price) {
      wx.showToast({ title: '请输入商品价格', icon: 'none' })
      return
    }

    wx.showLoading({ title: '保存中...' })
    try {
      const params = {
        id,
        name,
        price,
        images,
        detailInfo,
        type // 直接传 1/2/3/4/5 给后端
      }
      const res = await updateGoodsApi(params)
      if (res.code === 200) {
        wx.showToast({ title: '保存成功，已重新提交审核' })
        setTimeout(() => {
          wx.navigateBack()
        }, 1200)
      } else {
        wx.showToast({ title: res.msg || '保存失败', icon: 'none' })
      }
    } catch (err) {
      console.error(err)
      wx.showToast({ title: '网络异常', icon: 'none' })
    }
    wx.hideLoading()
  },

  // 取消返回
  goBack() {
    wx.navigateBack()
  }
})