import { getGoodsDetailApi, updateGoodsApi } from '../../api/goods.js'
import { uploadFile } from '../../api/upload.js'
import request from '../../utils/request.js'

Page({
  data: {
    loading: true,
    id: null,
    name: '',
    price: '',
    images: '',          // 存给后端的路径（不带前缀）
    showImages: '',      // 页面显示用（带前缀）
    detailInfo: '',
    type: 1,
    typeIndex: 0,
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
      let index = (info.type || 1) - 1
      index = Math.max(0, Math.min(4, index))

      // 拼接显示用的图片（不修改原数据）
      let showImg = ''
      if (info.images) {
        const img = info.images.split(',')[0]
        showImg = img.startsWith('http') ? img : request.baseURL + img
      }

      this.setData({
        name: info.name || '',
        price: info.price || '',
        images: info.images || '',   // 纯路径，给后端保存
        showImages: showImg,        // 页面显示
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

  inputName(e) {
    this.setData({ name: e.detail.value })
  },

  // ======================
  // ✅ 价格逻辑（和发布页完全一样）
  // ======================
  inputPrice(e) {
    let val = e.detail.value;
    val = val.replace(/[^\d.]/g, '');
    val = val.replace(/\.{2,}/g, '.');
    const dotIndex = val.indexOf('.');
    if (dotIndex === -1) {
      val = val.slice(0, 8);
    } else {
      const intPart = val.slice(0, dotIndex).slice(0, 8);
      const decimalPart = val.slice(dotIndex + 1, dotIndex + 3);
      val = intPart + '.' + decimalPart;
    }
    this.setData({ price: val });
  },

  inputDesc(e) {
    this.setData({ detailInfo: e.detail.value })
  },
  changeType(e) {
    const idx = Number(e.detail.value)
    this.setData({
      typeIndex: idx,
      type: idx + 1
    })
  },

  // 选择并上传图片（统一规范）
  async chooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: async (res) => {
        const tempPath = res.tempFilePaths[0]
        wx.showLoading({ title: '上传中...' })

        try {
          const uploadRes = await uploadFile(tempPath)
          if (uploadRes.code === 200) {
            const imgPath = uploadRes.data
            this.setData({
              images: imgPath,              // 仅路径，提交用
              showImages: request.baseURL + imgPath // 显示用
            })
            wx.showToast({ title: '上传成功', icon: 'success' })
          } else {
            wx.showToast({ title: '上传失败', icon: 'none' })
          }
        } catch (err) {
          wx.showToast({ title: '上传异常', icon: 'none' })
        } finally {
          wx.hideLoading()
        }
      }
    })
  },

  // 预览图片
  previewImage() {
    const { showImages } = this.data
    if (!showImages) return
    wx.previewImage({
      current: showImages,
      urls: [showImages]
    })
  },

  // ======================
  // ✅ 保存（增加价格正则校验）
  // ======================
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

    // ✅ 价格格式校验（和发布页一致）
    const reg = /^\d{1,8}(\.\d{2})?$/;
    if (!reg.test(price)) {
      wx.showToast({
        title: '请输入正确金额（0~99999999.99）',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    wx.showLoading({ title: '保存中...' })
    try {
      const params = {
        id, name, price,
        images: images || '', // 只传路径！
        detailInfo, type
      }
      const res = await updateGoodsApi(params)
      if (res.code === 200) {
        wx.showToast({ title: '保存成功，已重新提交审核' })
        setTimeout(() => wx.navigateBack(), 1200)
      } else {
        wx.showToast({ title: res.msg || '保存失败', icon: 'none' })
      }
    } catch (err) {
      console.error(err)
      wx.showToast({ title: '网络异常', icon: 'none' })
    }
    wx.hideLoading()
  },

  goBack() {
    wx.navigateBack()
  }
})