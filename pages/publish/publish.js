import { addGoodsApi } from '../../api/goods.js'
import { uploadFile } from '../../api/upload.js'
import request from '../../utils/request.js' 

Page({
  data: {
    loading: false,
    uploadLoading: false,

    goodsImgPath: '',   // 仅存路径：/ExchangeUploads/xxx.jpg（提交后端）
    goodsImgShow: '',   // 显示用：完整 http 地址（渲染用）

    goodsName: '',
    price: '',
    desc: '',
    typeList: ['书籍', '数码', '服饰', '电器', '其他'],
    typeIndex: 4,
  },

  // 唤起相册选图
  uploadImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath
        this.uploadToServer(tempFilePath)
      }
    })
  },

  // ======================
  // ✅ 上传：只存路径，显示用拼接好的URL
  // ======================
  async uploadToServer(tempFilePath) {
    this.setData({ uploadLoading: true })
    try {
      const res = await uploadFile(tempFilePath)
      if (res.code === 200) {
        const path = res.data
        this.setData({
          goodsImgPath: path,               // 路径（提交用）
          goodsImgShow: request.baseURL + path, // 完整地址（显示用）
        })
        wx.showToast({ title: '上传成功', icon: 'success' })
      } else {
        wx.showToast({ title: res.msg || '上传失败', icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '网络异常', icon: 'none' })
    } finally {
      this.setData({ uploadLoading: false })
    }
  },

  // 预览大图（拼接完整地址）
  previewImage() {
    const fullUrl = this.data.goodsImgShow
    if (!fullUrl) return
    wx.previewImage({
      urls: [fullUrl],
      current: fullUrl
    })
  },

  onNameInput(e) { this.setData({ goodsName: e.detail.value }) },
  onPriceInput(e) {
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
  onDescInput(e) { this.setData({ desc: e.detail.value }) },
  onTypeChange(e) { this.setData({ typeIndex: e.detail.value }) },

  // 发布提交（只传路径！）
  async submitGoods() {
    const { goodsImgPath, goodsName, price, desc, typeIndex } = this.data

    if (!goodsImgPath) {
      wx.showToast({ title: '请上传商品图片', icon: 'none' })
      return
    }
    if (!goodsName) {
      wx.showToast({ title: '请输入商品名称', icon: 'none' })
      return
    }
    if (!price) {
      wx.showToast({ title: '请输入价格', icon: 'none' })
      return
    }

    const reg = /^\d{1,8}(\.\d{2})?$/;
    if (!reg.test(price)) {
      wx.showToast({
        title: '请输入正确金额（0~99999999.99）',
        icon: 'none',
        duration: 2000
      });
      return;
    }

    this.setData({ loading: true })

    try {
      const res = await addGoodsApi({
        name: goodsName,
        price: price,
        detailInfo: desc,
        images: goodsImgPath, // ✅ 只传路径
        type: Number(typeIndex) + 1
      })

      if (res.code === 200) {
        wx.showToast({ title: '发布成功，等待审核', icon: 'success' })
        this.setData({
          goodsImgPath: '',
          goodsImgShow: '',
          goodsName: '',
          price: '',
          desc: '',
          typeIndex: 4
        })
        setTimeout(() => {
          wx.redirectTo({ url: '/pages/my-publish/my-publish' })
        }, 1500)
      } else {
        wx.showToast({ title: res.msg || '发布失败', icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '网络异常', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  }
})