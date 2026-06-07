import { sendEmailCodeDeleteAccountApi, deleteAccountApi } from '../../api/user.js'

Page({
  data: {
    email: '',
    code: '',
    codeText: '获取验证码',
    canSend: true,
    sending: false,
    loading: false,
    loadingText: ''
  },

  inputEmail(e) {
    this.setData({ email: e.detail.value })
  },

  inputCode(e) {
    this.setData({ code: e.detail.value })
  },

  // 发送验证码
  async sendCode() {
    const { canSend, sending, email } = this.data
    if (!canSend || sending) return

    if (!email) {
      wx.showToast({ title: '请输入邮箱', icon: 'none' })
      return
    }

    const reg = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!reg.test(email)) {
      wx.showToast({ title: '邮箱格式不正确', icon: 'none' })
      return
    }

    this.setData({ sending: true, codeText: '发送中...' })

    try {
      const res = await sendEmailCodeDeleteAccountApi(email)
      if (res.code === 200) {
        wx.showToast({ title: '验证码发送成功', icon: 'success' })
        this.startCountDown()
      } else if (res.code === 0) {
        wx.showModal({
          title: '提示',
          content: res.msg || '发送失败',
          showCancel: false
        })
        this.setData({ sending: false, codeText: '获取验证码' })
      }
    } catch (err) {
      console.log(err);
      wx.showToast({ title: '网络异常', icon: 'none' })
      this.setData({ sending: false, codeText: '获取验证码' })
    }
  },

  // 倒计时
  startCountDown() {
    let s = 60
    const timer = setInterval(() => {
      s--
      this.setData({ codeText: `${s}s` })
      if (s <= 0) {
        clearInterval(timer)
        this.setData({ canSend: true, codeText: '获取验证码', sending: false })
      }
    }, 1000)
    this.setData({ canSend: false, sending: true })
  },

  // 确认注销
  doDelete() {
    const { email, code } = this.data
    if (!email || !code) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }

    wx.showModal({
      title: '⚠️ 二次确认',
      content: '确认注销账号吗？所有数据将被清空且无法恢复！',
      confirmText: '确认注销',
      confirmColor: '#ff3333',
      success: async (res) => {
        if (!res.confirm) return

        this.setData({ loading: true, loadingText: '注销中...' })

        try {
          const result = await deleteAccountApi({
            email: email,
            code: code
          })

          if (result.code === 200) {
            wx.showModal({
              title: '注销成功',
              content: '账号已注销，感谢您的使用，期待下次相遇！',
              showCancel: false,
              success: () => {
                wx.clearStorageSync()
                wx.redirectTo({ url: '/pages/login/login' })
              }
            })
          } else if (result.code === 0) {
            wx.showModal({
              title: '提示',
              content: result.msg || '注销失败',
              showCancel: false
            })
          }
        } catch (err) {
          wx.showToast({ title: '网络异常', icon: 'none' })
        } finally {
          this.setData({ loading: false })
        }
      }
    })
  }
})