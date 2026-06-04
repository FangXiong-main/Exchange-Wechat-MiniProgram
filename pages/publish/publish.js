import { addGoodsApi } from '../../api/goods.js'

Page({
  data: {
    loading: false,
    goodsImg: '',
    goodsName: '',
    price: '',
    desc: '',
    typeList: ['书籍', '数码', '服饰', '电器', '其他'],
    typeIndex: 4,
  },

  // 选择图片
  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: (res) => {
        this.setData({ goodsImg: res.tempFiles[0].tempFilePath })
      }
    })
  },

  onNameInput(e) { 
    this.setData({ goodsName: e.detail.value }) 
  },

  // ========== 金额输入限制（最终版） ==========
  // 整数最多 8 位，小数最多 2 位，标准金额格式
  onPriceInput(e) {
    let val = e.detail.value;

    // 1. 只保留数字和一个小数点
    val = val.replace(/[^\d.]/g, '');
    val = val.replace(/\.{2,}/g, '.');

    // 2. 限制整数位最多 8 位
    const dotIndex = val.indexOf('.');
    if (dotIndex === -1) {
      // 没有小数点，限制整数 8 位
      val = val.slice(0, 8);
    } else {
      // 有小数点：整数 8 位 + 小数 2 位
      const intPart = val.slice(0, dotIndex).slice(0, 8);
      const decimalPart = val.slice(dotIndex + 1, dotIndex + 3);
      val = intPart + '.' + decimalPart;
    }

    this.setData({ price: val });
  },

  onDescInput(e) { 
    this.setData({ desc: e.detail.value }) 
  },
  onTypeChange(e) { 
    this.setData({ typeIndex: e.detail.value }) 
  },

  // 发布提交
  async submitGoods() {
    const { goodsImg, goodsName, price, desc, typeIndex } = this.data

    if (!goodsName) {
      wx.showToast({ title: '请输入商品名称', icon: 'none' })
      return
    }
    if (!price) {
      wx.showToast({ title: '请输入价格', icon: 'none' })
      return
    }

    // 最终校验
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
        images: goodsImg,
        type: Number(typeIndex) + 1
      })

      if (res.code === 200) {
        wx.showToast({
          title: '商品已提交发布，等待审核',
          icon: 'success'
        })
        // 清空
        this.setData({
          goodsImg: '',
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