import request from '../utils/request.js'

// 登录
export const loginByPasswordApi = (data) => 
  request.post('/loginWithEmail', data)

export const loginByCodeApi = (data) => 
  request.post('/loginWithCode', data)

export const sendEmailCodeApi = (email) => 
  request.post('/sendEmailCode?email=' + email)

// 个人中心
export const getUserInfoApi = () => 
  request.get('/user/current')  

export const getMyPublishApi = () => 
  request.get('/goods/my-publish')

export const getMyOrderApi = () => 
  request.get('/order/my-order')

export const logoutApi = () => 
  request.post('/logout')

//填写学校
export const updateSchoolApi = (school)=>
  request.post('/user/setSchool',{
      school: school
    }
  )

// 修改用户资料（需审核）
export function updateUserInfoApi(data) {
    return request.post('/user/updateInfo', data)
  }
//检测信息是否变更
  export const infoIsChangedApi = () => {
    return request.get('/user/infoIsChanged')
  }
// 获取所有学校列表
export const getSchoolListApi = () => {
    return request.get('/user/schoolList')
  }

export const getUserEXCWalletList = (page,pageSize) => request.get('/user/getUserEXCWalletList',{page:page,pageSize:pageSize})

export const getUserBalanceApi = ()=>request.get('/user/getExcWalletBalance')