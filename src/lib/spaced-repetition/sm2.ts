/**
 * SM-2 间隔重复算法
 *
 * @param quality - 用户反馈: 0=不认识, 1=模糊, 2=认识
 * @param prevEase - 之前的 ease factor (默认 2.5)
 * @param prevInterval - 之前的间隔天数
 * @param prevRepetitions - 之前的复习次数
 */
export function sm2(
  quality: number,
  prevEase: number = 2.5,
  prevInterval: number = 0,
  prevRepetitions: number = 0,
) {
  let ease = prevEase
  let interval = prevInterval
  let repetitions = prevRepetitions

  if (quality >= 2) {
    // 正确的回答
    if (repetitions === 0) {
      interval = 1
    } else if (repetitions === 1) {
      interval = 3
    } else {
      interval = Math.round(prevInterval * ease)
    }
    repetitions += 1
  } else {
    // 错误的回答
    repetitions = 0
    interval = 1
  }

  // 更新 ease factor
  ease = ease + (0.1 - (2 - quality) * (0.08 + (2 - quality) * 0.02))
  if (ease < 1.3) ease = 1.3

  // 计算下次复习日期
  const nextReview = new Date()
  nextReview.setDate(nextReview.getDate() + interval)

  return { ease, interval, repetitions, nextReview }
}

/**
 * 计算今日需要复习的单词数
 */
export function getWordsDueForReview(
  progressList: { nextReview: Date }[],
): number {
  const now = new Date()
  return progressList.filter((p) => new Date(p.nextReview) <= now).length
}
