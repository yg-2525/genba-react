import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SearchFilter from '../components/SearchFilter'

function renderFilter(overrides = {}) {
  const props = {
    searchName: '',
    filterStartDate: '',
    filterEndDate: '',
    onSearchName: vi.fn(),
    onStartDate: vi.fn(),
    onEndDate: vi.fn(),
    onReset: vi.fn(),
    ...overrides,
  }
  render(<SearchFilter {...props} />)
  return props
}

describe('SearchFilter', () => {
  it('検索欄・日付欄・リセットボタンを表示する', () => {
    renderFilter()
    expect(screen.getByPlaceholderText('現場名で検索')).toBeInTheDocument()
    expect(screen.getByText('リセット')).toBeInTheDocument()
  })

  it('現場名を入力すると onSearchName が呼ばれる', async () => {
    const props = renderFilter()
    await userEvent.type(screen.getByPlaceholderText('現場名で検索'), 'A')
    expect(props.onSearchName).toHaveBeenCalledWith('A')
  })

  it('リセットボタンを押すと onReset が呼ばれる', async () => {
    const props = renderFilter()
    await userEvent.click(screen.getByText('リセット'))
    expect(props.onReset).toHaveBeenCalledTimes(1)
  })
})
