import { sendEmailCodeChangePwdApi, changeUserPwdApi } from '../../api/user.js'

Page({
  data: {
    email: '',
    code: '',
    newPwd: '',
    confirmPwd: '',

    codeText: '获取验证码',
    canSend: true,
    sending: false,
    loading: false,
    loadingText: ''
  },

  // 输入邮箱
  inputEmail(e) {
    this.setData({ email: e.detail.value })
  },

  // 输入验证码
  inputCode(e) {
    this.setData({ code: e.detail.value })
  },

  // 新密码
  inputNewPwd(e) {
    this.setData({ newPwd: e.detail.value })
  },

  // 确认密码
  inputConfirmPwd(e) {
    this.setData({ confirmPwd: e.detail.value })
  },

  async sendCode() {
    const { canSend, sending, email } = this.data
    if (!canSend || sending) return
  
    // 校验邮箱
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
      const res = await sendEmailCodeChangePwdApi(email)
      if (res.code === 200) {
        wx.showToast({ title: '验证码发送成功', icon: 'success' })
        this.startCountDown()
      } else if (res.code === 0) {
        wx.showModal({
          title: '提示',
          content: res.msg || '发送失败',
          showCancel: false
        })
        this.setData({
          sending: false,
          codeText: '获取验证码'
        })
      } else {
        wx.showToast({
          title: res.msg || '发送失败',
          icon: 'none'
        })
        this.setData({
          sending: false,
          codeText: '获取验证码'
        })
      }
    } catch (err) {
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

  // ------------------------------
  // 密码强度校验
  // ------------------------------
  validPwd(pwd) {
    if (pwd.length < 6) return false
    const hasLetter = /[a-zA-Z]/.test(pwd)
    const hasNumber = /\d/.test(pwd)
    const hasSymbol = /[^a-zA-Z0-9]/.test(pwd)
    return hasLetter && hasNumber && hasSymbol
  },

  // ------------------------------
  // 确认修改密码
  // ------------------------------
  async doChangePwd() {
    const { email, code, newPwd, confirmPwd, loading } = this.data
    if (loading) return
  
    // 非空校验
    if (!email || !code || !newPwd || !confirmPwd) {
      wx.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }
  
    // 密码一致
    if (newPwd !== confirmPwd) {
      wx.showToast({ title: '两次输入密码不一致', icon: 'none' })
      return
    }
  
    // 强度校验
    if (!this.validPwd(newPwd)) {
      wx.showModal({
        title: '密码格式错误',
        content: '必须6位以上，包含字母、数字、特殊字符',
        showCancel: false
      })
      return
    }
  
    // 加载
    this.setData({ loading: true, loadingText: '修改中...' })
  
    try {
      const res = await changeUserPwdApi({
        email: email,
        code: code,
        password: newPwd
      })
  
      if (res.code === 200) {
        wx.showModal({
          title: '成功',
          content: '密码修改成功，请重新登录',
          showCancel: false,
          success: () => {
            wx.clearStorageSync()
            wx.redirectTo({ url: '/pages/login/login' })
          }
        })
      } else if (res.code === 0) {
        wx.showModal({
          title: '提示',
          content: res.msg || '修改失败',
          showCancel: false
        })
      } else {
        wx.showToast({ title: res.msg || '操作失败', icon: 'none' })
      }
    } catch (err) {
      wx.showToast({ title: '网络异常', icon: 'none' })
    } finally {
      this.setData({ loading: false })
    }
  }
})