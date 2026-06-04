import { publishPostApi } from '../../api/post.js';

Page({
  data: {
    content: '',
    imgUrl: '',
    typeIndex: 0,
    typeList: ['好人好事', '失物招领', '校园闲聊', '生活互助'],
    canPublish: false,
    showTypePanel:false //控制下拉弹窗显示隐藏
  },

  onInput(e) {
    const content = e.detail.value;
    this.setData({ content });
    this.checkBtn();
  },

  //打开下拉弹窗
  openTypeSelect(){
    this.setData({showTypePanel:true})
  },
  //关闭弹窗
  closeTypeSelect(){
    this.setData({showTypePanel:false})
  },
  //选中分类
  selectType(e){
    const idx = e.currentTarget.dataset.index;
    this.setData({
      typeIndex:idx,
      showTypePanel:false
    })
  },

  // 检查按钮
  checkBtn() {
    const can = this.data.content.trim().length > 0;
    this.setData({ canPublish: can });
  },

  // 选择图片
  chooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: (res) => {
        this.upload(res.tempFiles[0].tempFilePath);
      }
    });
  },

  // 上传图片（换成你自己的上传接口）
  upload(filePath) {
    wx.showLoading({ title: '上传中' });
    wx.uploadFile({
      url: 'https://你的上传接口',
      filePath: filePath,
      name: 'file',
      success: (res) => {
        const data = JSON.parse(res.data);
        this.setData({ imgUrl: data.url });
      },
      complete: () => wx.hideLoading()
    });
  },

  deleteImg() {
    this.setData({ imgUrl: '' });
  },

  // 发布（带 type 传给后端）
  async publish() {
    const { content, imgUrl, typeIndex } = this.data;
    if (!content.trim()) {
      wx.showToast({ title: '请输入内容', icon: 'none' });
      return;
    }
    // 下标0→1，依次+1
    const type = Number(typeIndex) + 1;

    wx.showLoading({ title: '发布中...' });

    try {
      const res = await publishPostApi({
        content: content,
        images: imgUrl || '',
        type: type
      });

      if (res.code === 200) {
        wx.showToast({ title: '发布成功' });
        setTimeout(() => wx.navigateBack(), 1500);
      } else {
        wx.showToast({ title: res.msg || '发布失败', icon: 'none' });
      }
    } catch (err) {
      wx.showToast({ title: '网络异常', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  }
});