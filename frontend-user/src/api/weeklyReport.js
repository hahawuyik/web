import request from '@/utils/request';

// 获取当前用户的周报列表
export const getMyWeeklyReports = () => {
  return request.get('/weekly-report/my');
};

// 获取单条周报详情（如果后端提供了）
export const getWeeklyReportDetail = (id) => {
  return request.get(`/weekly-report/${id}`);
};