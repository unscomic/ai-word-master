import { describe, it, expect } from "vitest"
import { sm2, getWordsDueForReview } from "./sm2"

describe("SM-2 间隔重复算法", () => {
  it("首次学习且认识（quality=2），应返回 interval=1", () => {
    const result = sm2(2, 2.5, 0, 0)
    expect(result.interval).toBe(1)
    expect(result.repetitions).toBe(1)
    expect(result.ease).toBeGreaterThanOrEqual(1.3)
  })

  it("模糊（quality=1），应重置 interval=1", () => {
    const result = sm2(1, 2.5, 0, 0)
    expect(result.interval).toBe(1)
    expect(result.repetitions).toBe(0)
  })

  it("不认识（quality=0），应重置 interval=1", () => {
    const result = sm2(0, 2.5, 0, 0)
    expect(result.interval).toBe(1)
    expect(result.repetitions).toBe(0)
  })

  it("多次正确回答后，间隔应递增", () => {
    const r1 = sm2(2, 2.5, 0, 0)
    expect(r1.interval).toBe(1)

    const r2 = sm2(2, r1.ease, r1.interval, r1.repetitions)
    expect(r2.interval).toBe(3)

    const r3 = sm2(2, r2.ease, r2.interval, r2.repetitions)
    // interval = round(prevInterval * ease) = round(3 * ~2.5) = ~7-8
    expect(r3.interval).toBeGreaterThanOrEqual(6)
    expect(r3.interval).toBeLessThanOrEqual(9)
  })

  it("连续错误应保持 interval=1", () => {
    let state = { ease: 2.5, interval: 10, repetitions: 5 }
    state = sm2(0, state.ease, state.interval, state.repetitions)
    expect(state.interval).toBe(1)
    expect(state.repetitions).toBe(0)

    state = sm2(0, state.ease, state.interval, state.repetitions)
    expect(state.interval).toBe(1)
    expect(state.repetitions).toBe(0)
  })

  it("未学习后认识，应正确重置 repetitions=0", () => {
    const result = sm2(2, 2.5, 0, 0)
    expect(result.repetitions).toBe(1)
    expect(result.interval).toBe(1)
  })

  it("SM-2 正确回答了两次，然后回答错误，应重置", () => {
    const r1 = sm2(2, 2.5, 0, 0)
    const r2 = sm2(2, r1.ease, r1.interval, r1.repetitions)
    const r3 = sm2(1, r2.ease, r2.interval, r2.repetitions)

    expect(r3.repetitions).toBe(0)
    expect(r3.interval).toBe(1)
  })

  it("nextReview 应在正确的天数后", () => {
    const result = sm2(2, 2.5, 0, 0)
    const expected = new Date()
    expected.setDate(expected.getDate() + 1)
    expect(result.nextReview.getDate()).toBe(expected.getDate())
  })

  it("ease factor 不能低于 1.3", () => {
    let state = { ease: 1.3, interval: 1, repetitions: 0 }
    for (let i = 0; i < 10; i++) {
      state = sm2(0, state.ease, state.interval, state.repetitions)
    }
    expect(state.ease).toBeGreaterThanOrEqual(1.3)
  })
})

describe("getWordsDueForReview", () => {
  it("应返回到期复习的单词数", () => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)

    const progressList = [
      { nextReview: yesterday },
      { nextReview: yesterday },
      { nextReview: tomorrow },
    ]

    expect(getWordsDueForReview(progressList)).toBe(2)
  })

  it("没有到期单词时应返回 0", () => {
    const future = new Date()
    future.setDate(future.getDate() + 10)

    const progressList = [{ nextReview: future }, { nextReview: future }]

    expect(getWordsDueForReview(progressList)).toBe(0)
  })

  it("空列表应返回 0", () => {
    expect(getWordsDueForReview([])).toBe(0)
  })
})
