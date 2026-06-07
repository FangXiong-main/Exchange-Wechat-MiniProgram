Page({
    // 修改密码
    goChangePwd() {
      wx.navigateTo({
        url: '/pages/changeKey/changeKey'
      })
    },
  
    // 注销账号
    goDeleteAccount() {
        wx.navigateTo({
            url: '/pages/logOff/logOff'
          })
    }
  })