/**
 * 題庫 hook — 合併內建與自訂題庫，並持久化自訂題目
 * Copyright (c) 2026 Scout System. All rights reserved.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  type BankId,
  type Question,
  type QDifficulty,
  bankStats,
  drawQuestions,
  filterQuestions,
  listCategories,
  loadCustom,
  saveCustom,
} from './questionBank'

export function useQuestionBank(bank: BankId, builtIn: readonly Question[]) {
  const [custom, setCustom] = useState<Question[]>(() => loadCustom(bank))

  useEffect(() => {
    saveCustom(bank, custom)
  }, [bank, custom])

  const all = useMemo(() => [...builtIn, ...custom], [builtIn, custom])
  const categories = useMemo(() => listCategories(all), [all])
  const stats = useMemo(() => bankStats(all), [all])

  const draw = useCallback(
    (opts: { levels?: QDifficulty[]; categories?: string[]; count?: number }) =>
      drawQuestions(all, opts),
    [all],
  )

  const countMatching = useCallback(
    (opts: { levels?: QDifficulty[]; categories?: string[] }) => filterQuestions(all, opts).length,
    [all],
  )

  return { all, custom, setCustom, categories, stats, draw, countMatching }
}
