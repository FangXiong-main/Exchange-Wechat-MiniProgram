import {
    logoutApi,
    infoIsChangedApi,
    getUserInfoApi
  } from '../../api/user.js'
  import { getSchoolListApi } from '../../api/user.js'
  import { getUnresolvedOrdersCountApi } from '../../api/order.js'
  import request from '../../utils/request.js'
  
  Page({
    data: {
      userInfo: {},
      schoolName: '',
      loading: false,
      changedStatus: 0,
      auditStatus: 0,
      unresolvedCount: 0
    },
  
    onShow() {
      // 1. 从 storage 取出原始数据（绝对不改！）
      let originalUser = wx.getStorageSync('userInfo') || {}
  
      // 2. 【关键】创建一个副本，只在副本上拼接头像
      let showUser = { ...originalUser }
  
      // 3. 只给副本拼接头像，不影响原始数据！
      if (showUser.avatarUrl && !showUser.avatarUrl.startsWith('http')) {
        showUser.avatarUrl = request.baseURL + showUser.avatarUrl
      }
  
      // 4. 渲染副本，storage 纹丝不动
      this.setData({
        userInfo: showUser
      })
  
      this.loadSchoolData()
      this.checkInfoStatus()
      this.getUnresolvedOrdersCount()
    },
  
    async getUnresolvedOrdersCount() {
      try {
        const res = await getUnresolvedOrdersCountApi()
        if (res.code === 200) {
          let num = res.data ?? 0
          this.setData({ unresolvedCount: num })
        } else {
          this.setData({ unresolvedCount: 0 })
        }
      } catch (err) {
        this.setData({ unresolvedCount: 0 })
      }
    },
  
    async loadSchoolData() {
      try {
        const userInfo = this.data.userInfo
        const schoolId = userInfo.school
  
        if (!schoolId) {
          this.setData({ schoolName: '' })
          return
        }
  
        let schoolMap = wx.getStorageSync('schoolName')
  
        if (!schoolMap) {
          this.setData({ loading: true })
          const res = await getSchoolListApi()
          if (res.code === 200) {
            schoolMap = res.data || {}
            wx.setStorageSync('schoolName', schoolMap)
          }
        }
  
        const schoolObj = schoolMap[schoolId]
        const name = schoolObj?.school_name || '未知学校'
        this.setData({ schoolName: name })
  
      } catch (err) {
        console.error('加载学校失败', err)
      } finally {
        this.setData({ loading: false })
      }
    },
  
    async checkInfoStatus() {
      try {
        const res = await infoIsChangedApi()
        if (res.code !== 200) return
  
        if (res.data === null) {
          this.setData({
            changedStatus: 0,
            auditStatus: 0
          })
          return
        }
  
        const data = res.data
        this.setData({
          changedStatus: data.changedStatus,
          auditStatus: data.auditStatus
        })
  
        if (data.auditStatus === -1) {
          wx.showModal({
            title: '提示',
            content: '管理员超时未处理您修改个人信息的请求，您的请求已被删除，非常抱歉，您可以重新修改。',
            showCancel: false,
            success: () => {
              this.setData({ changedStatus: 0, auditStatus: 0 })
            }
          })
          return
        }
  
        if (data.auditStatus === 2) {
          wx.showModal({
            title: '提示',
            content: "您的修改个人信息请求已被驳回，原因：" + (data.rejectReason || "未填写原因"),
            showCancel: false,
            success: () => {
              this.setData({ changedStatus: 0, auditStatus: 0 })
            }
          })
          return
        }
  
        if (data.auditStatus === 1) {
          wx.showModal({
            title: '提示',
            content: '您的个人信息审核已通过',
            showCancel: false,
            success: async () => {
              this.setData({ loading: true })
              try {
                const userRes = await getUserInfoApi()
                if (userRes.code === 200) {
                  let newUser = userRes.data
  
                  // ✅ 直接存原始数据，不拼接！
                  wx.setStorageSync('userInfo', newUser)
  
                  // ✅ 页面重新渲染，onShow 会自己拼接头像
                  this.onShow()
                }
              } finally {
                this.setData({
                  loading: false,
                  changedStatus: 0,
                  auditStatus: 0
                })
              }
            }
          })
        }
  
      } catch (err) {
        console.error('checkInfoStatus error', err)
      }
    },
  
    goEditUser() { wx.navigateTo({ url: '/pages/edit-user/edit-user' }) },
    goMyPublish() { wx.navigateTo({ url: '/pages/my-publish/my-publish' }) },
    goMyOrder() { wx.navigateTo({ url: '/pages/order/order' }) },
    goMyFavorite() { wx.navigateTo({ url: '/pages/favorite/favorite' }) },
    goExcWallet() { wx.navigateTo({ url: '/pages/excWallet/excWallet' }) },
    goAccount() { wx.navigateTo({ url: '/pages/account/account' }) },
  
    logout() {
      wx.showModal({
        title: '退出登录',
        content: '确定要退出吗？',
        success: async (res) => {
          if (!res.confirm) return
          try {
            const result = await logoutApi()
            if (result.code === 200) {
              wx.clearStorageSync()
              wx.redirectTo({ url: '/pages/login/login' })
            } else {
              wx.showToast({ title: result.msg || '退出失败', icon: 'none' })
            }
          } catch (err) {
            wx.showToast({ title: '网络异常', icon: 'none' })
          }
        }
      })
    }
  })