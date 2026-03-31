import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ToastProvider } from '../contexts/ToastContext'
import InputForm from '../components/InputForm'
import type { GembaData } from '../types'

function renderInputForm(onAdd: (data: GembaData) => void) {
  render(
    <ToastProvider>
      <InputForm onAdd={onAdd} />
    </ToastProvider>
  )
}

describe('InputForm', () => {
  it('必須項目が空のとき onAdd が呼ばれない', async () => {
    const onAdd = vi.fn()
    renderInputForm(onAdd)

    await userEvent.click(screen.getByText('追加'))

    expect(onAdd).not.toHaveBeenCalled()
  })

  it('全項目を入力すると onAdd が正しいデータで呼ばれる', async () => {
    const onAdd = vi.fn()
    renderInputForm(onAdd)

    await userEvent.type(screen.getByLabelText('現場名 *'), 'A川')
    await userEvent.type(screen.getByLabelText('日付 *'), '2026-03-31')
    await userEvent.type(screen.getByLabelText('水位を手入力（m）'), '1.5')
    await userEvent.type(screen.getByLabelText('流速（m/s）'), '2.0')
    await userEvent.type(screen.getByLabelText('断面積（㎡）'), '3.0')

    await userEvent.click(screen.getByText('追加'))

    expect(onAdd).toHaveBeenCalledOnce()
    const arg = onAdd.mock.calls[0][0] as GembaData
    expect(arg.name).toBe('A川')
    expect(arg.flow).toBe('6.00') // 2.0 × 3.0
  })

  it('追加後にフォームがリセットされる', async () => {
    const onAdd = vi.fn()
    renderInputForm(onAdd)

    const nameInput = screen.getByLabelText('現場名 *')
    await userEvent.type(nameInput, 'テスト現場')
    await userEvent.type(screen.getByLabelText('日付 *'), '2026-03-31')
    await userEvent.type(screen.getByLabelText('水位を手入力（m）'), '1.5')
    await userEvent.type(screen.getByLabelText('流速（m/s）'), '2.0')
    await userEvent.type(screen.getByLabelText('断面積（㎡）'), '3.0')

    await userEvent.click(screen.getByText('追加'))

    expect(nameInput).toHaveValue('')
  })
})
