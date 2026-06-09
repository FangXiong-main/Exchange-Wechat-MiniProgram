import request from '../utils/request.js'

// ======================
// 商品相关接口
// ======================

// 获取我的发布商品（分页）
export const getMyGoodsApi = (params) => 
  request.get('/user/goods/my', { params })

// 发布商品（新增！）
export const addGoodsApi = (data) => 
  request.post('/goods/addGoods', data)

// 删除商品
export const deleteGoodsApi = (id) => 
  request.post('/goods/deleteGoods', { id })

// 修改商品上下架状态
export const changeSaleStatusApi = (data) => 
  request.post('/goods/change-sale-status', data)

// ======================
// 收藏相关接口
// ======================

// 获取我的收藏列表
export const getMyFavoriteApi = (params) => 
  request.get('/goods/favorite', { params })

// 收藏 / 取消收藏
export const toggleFavoriteApi = (params) => request.post('/goods/favorite/toggle', params)

export const getNewGoodsPage = (pageNum,pageSize)=> request.get('/goods/newGoodsPage',{
    pageNum:pageNum,
    pageSize:pageSize
  })

// ======================
// 商品详情
// ======================
export const getGoodsDetailApi = (id) => 
  request.get('/goods/goodsDetail?id=' + id)

// 修改商品
export const updateGoodsApi = (param) =>
  request.post('/goods/updateGoods', param)

//查询商品列表
export const getGoodsListByTypeOrSearchApi = (params) => request.post('/goods/getGoodsListByTypeOrSearchApi',params)