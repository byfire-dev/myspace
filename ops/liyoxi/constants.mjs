export const COURSE_NAMES = Object.freeze({
  1: '音频+AIGC：MV带货',
  2: '混剪模版带货',
  3: '口播+特效模版带货',
  4: '短剧带货',
  5: 'TVC短片',
  6: '短片带货',
  7: '信息流带货',
  8: '高质量实拍带货',
  9: '访谈带货',
  10: 'KOL带货',
  11: '海外带货流程和实践',
  12: '图文GEO',
  13: '视频GEO',
});

export const SOURCE_NAMES = Object.freeze({ official_account: '公众号', website: '官网', direct: '直接访问' });

const beijingFormatter = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
});

export function formatBeijingTime(value) {
  const parts = Object.fromEntries(beijingFormatter.formatToParts(new Date(value)).map(part => [part.type, part.value]));
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

export function formatCourses(ids) {
  return ids.length ? ids.map(id => `${id}. ${COURSE_NAMES[id] || '未知课程'}`).join('；') : '请顾问推荐';
}
