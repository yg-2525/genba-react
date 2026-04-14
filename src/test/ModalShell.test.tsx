import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ModalShell from '../components/ModalShell'

function renderShell(onClose = vi.fn()) {
  render(
    <ModalShell onClose={onClose} ariaLabelledBy="test-title">
      <h2 id="test-title">テストタイトル</h2>
      <button>ボタンA</button>
      <button>ボタンB</button>
    </ModalShell>,
  )
  return onClose
}

describe('ModalShell', () => {
  it('子要素をレンダリングする', () => {
    renderShell()
    expect(screen.getByText('テストタイトル')).toBeInTheDocument()
  })

  it('Escキーを押すと onClose が呼ばれる', async () => {
    const onClose = renderShell()
    await userEvent.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('role="dialog" と aria-modal が設定される', () => {
    renderShell()
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'test-title')
  })

  it('モーダル内クリックは stopPropagation される', async () => {
    const onClose = renderShell()
    await userEvent.click(screen.getByText('ボタンA'))
    expect(onClose).not.toHaveBeenCalled()
  })
})
