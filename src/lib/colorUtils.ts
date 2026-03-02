/**
 * 计算颜色的亮度
 * @param color - 十六进制颜色代码 (如 #FF0000) 或 HSL 颜色
 * @returns 亮度值 (0-255)
 */
export function calculateBrightness(color: string): number {
  // 移除 # 符号
  const hex = color.replace('#', '');

  // 转换为 RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // 使用 YIQ 公式计算亮度
  return (r * 299 + g * 587 + b * 114) / 1000;
}

/**
 * 根据背景色自动选择最佳的文字颜色
 * @param backgroundColor - 背景颜色
 * @returns 文字颜色 (黑色或白色)
 */
export function getContrastTextColor(backgroundColor: string): string {
  try {
    const brightness = calculateBrightness(backgroundColor);
    // 亮度大于 128 使用黑色文字，否则使用白色文字
    return brightness > 128 ? '#000000' : '#FFFFFF';
  } catch {
    // 如果颜色解析失败，默认返回黑色
    return '#000000';
  }
}

/**
 * 生成随机的高对比度颜色
 * @returns 十六进制颜色代码
 */
export function generateRandomColor(): string {
  const colors = [
    '#3B82F6', // 蓝色
    '#10B981', // 绿色
    '#F59E0B', // 橙色
    '#EF4444', // 红色
    '#8B5CF6', // 紫色
    '#EC4899', // 粉色
    '#14B8A6', // 青色
    '#F97316', // 橘色
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * 检查两个颜色之间的对比度
 * @param color1 - 第一个颜色
 * @param color2 - 第二个颜色
 * @returns 对比度比值
 */
export function calculateContrast(color1: string, color2: string): number {
  const l1 = calculateBrightness(color1);
  const l2 = calculateBrightness(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * 验证颜色对比度是否符合 WCAG AA 标准
 * @param backgroundColor - 背景色
 * @param textColor - 文字颜色
 * @returns 是否符合标准
 */
export function isAccessibleContrast(backgroundColor: string, textColor: string): boolean {
  const contrast = calculateContrast(backgroundColor, textColor);
  return contrast >= 4.5; // WCAG AA 标准要求至少 4.5:1
}