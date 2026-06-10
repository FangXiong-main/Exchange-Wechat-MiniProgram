import request from '../utils/request.js'

export const getPostPageApi = (params)=>request.get('/post/pages',params)

export const getCommentListApi = (params)=>request.get('/post/commentList',params)

export const addCommentApi = (params)=>request.post('/post/addComment',params)

export const publishPostApi = (params)=>request.post('/post/publishPost',params)

export const addViewCountApi = (postId) => request.get('/post/addViewCount',{postId})

export const deletePostApi = (id) => request.post('/post/deletePost',id)

export const getSearchedPostListApi = (params) => request.post('/post/getSearchedPostList',params) 