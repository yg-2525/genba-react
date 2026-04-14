import { useEffect, useRef, type ReactNode } from 'react'

type Props = {
  onClose: () => void
  ariaLabelledBy: string
  children: ReactNode
}

export default function ModalShell({ onClose, ariaLabelledBy, children }: Props) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      // フォーカストラップ
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    // 開いた時にモーダル内にフォーカス
    const prev = document.activeElement as HTMLElement | null
    modalRef.current?.querySelector<HTMLElement>('button, input, select, textarea')?.focus()

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      prev?.focus()
    }
  }, [onClose])

  return (
    <div
      ref={modalRef}
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby={ariaLabelledBy}
      onClick={e => e.stopPropagation()}
    >
      {children}
    </div>
  )
}
