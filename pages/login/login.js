// 引入API
import {
    loginByPasswordApi,
    loginByCodeApi,
    sendEmailCodeApi
  } from '../../api/user.js'
  
  Page({
    data: {
      type: 'password',
      email: '',
      pwd: '',
      code: '',
      codeText: '获取验证码',
      canSend: true,
      loading: false,
      loginLoading: false
    },
  
    // 切换登录方式
    switchType(e) {
      this.setData({
        type: e.currentTarget.dataset.type
      })
    },
  
    // 输入邮箱
    inputEmail(e) {
      this.setData({ email: e.detail.value })
    },
  
    // 输入密码
    inputPwd(e) {
      this.setData({ pwd: e.detail.value })
    },
  
    // 输入验证码
    inputCode(e) {
      this.setData({ code: e.detail.value })
    },
  
    // 发送验证码
    async sendCode() {
      const { canSend, loading, email } = this.data
      if (!canSend || loading) return
  
      if (!email) {
        wx.showToast({ title: '请输入邮箱', icon: 'none' })
        return
      }
  
      this.setData({ loading: true, codeText: '发送中...' })
  
      try {
        const res = await sendEmailCodeApi(email)
  
        // ===== 200 = 成功 =====
        if (res.code === 200) {
          wx.showToast({ title: '验证码发送成功', icon: 'success' })
          this.setData({ canSend: false, loading: false })
          let second = 60
          const timer = setInterval(() => {
            second--
            this.setData({ codeText: `${second}秒后重发` })
            if (second <= 0) {
              clearInterval(timer)
              this.setData({ canSend: true, codeText: '获取验证码' })
            }
          }, 1000)
        } else {
          // ===== 其他 = 失败，显示后端信息 =====
          wx.showToast({ title: res.msg || '发送失败', icon: 'none' })
          this.setData({ loading: false, codeText: '获取验证码' })
        }
  
      } catch (err) {
        console.error(err)
        wx.showToast({ title: '网络异常', icon: 'none' })
        this.setData({ loading: false, codeText: '获取验证码' })
      }
    },
  
    // 登录
    async login() {
      const { email, pwd, code, type, loginLoading } = this.data
      if (loginLoading) return
  
      if (!email) {
        wx.showToast({ title: '请输入邮箱', icon: 'none' })
        return
      }
  
      this.setData({ loginLoading: true })
  
      try {
        let res
        if (type === 'password') {
          if (!pwd) {
            wx.showToast({ title: '请输入密码', icon: 'none' })
            this.setData({ loginLoading: false })
            return
          }
          res = await loginByPasswordApi({ email, password: pwd })
        } else {
          if (!code) {
            wx.showToast({ title: '请输入验证码', icon: 'none' })
            this.setData({ loginLoading: false })
            return
          }
          res = await loginByCodeApi({ email, code: code })
        }
  
        // ===== 200 = 登录成功 =====
        if (res.code === 200) {
          const userInfo = res.data;
          wx.setStorageSync('userInfo', userInfo)
  
          if (!userInfo.school || userInfo.school === 0) {
            // 学校为空 → 提示并跳转到编辑用户页
            wx.showToast({
              title: '请设置你的学校',
              icon: 'none',
              duration: 2000
            })
            setTimeout(() => {
              wx.navigateTo({
                url: '/pages/school/school'
              })
            }, 2000)
          } else {
            // 学校已设置 → 正常回首页
            wx.showToast({ title: '登录成功', icon: 'success' })
            setTimeout(() => {
              wx.switchTab({ url: '/pages/index/index' })
            }, 1500)
          }
  
        } else if (res.code === 0) {
          // ===== code=0 → 弹窗提示 + 清空表单 =====
          wx.showModal({
            title: '提示',
            content: res.msg || '登录失败',
            showCancel: false,
            success: () => {
              // 清空所有表单数据
              this.setData({
                pwd: '',
                code: ''
              })
            }
          })
        } else {
          // ===== 其他失败 =====
          wx.showToast({ title: res.msg || '登录失败', icon: 'none' })
        }
  
      } catch (err) {
        console.error(err)
        wx.showToast({ title: '网络异常，请重试', icon: 'none' })
      } finally {
        this.setData({ loginLoading: false })
      }
    },
  
    // 跳转使用须知
    goRule() {
      wx.navigateTo({
        url: '/pages/rule/rule'
      })
    }
  })