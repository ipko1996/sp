import { EditableText } from '../../components/editable-text.tsx'
import { PhotoSlot } from '../../components/photo-slot.tsx'
import { placeholderLeft, placeholderRight } from '../../lib/generated/placeholders.ts'
import type { Menu } from '../../types/menu.ts'
import type { MenuActions } from '../menu/use-menu.ts'

interface FooterProps {
  menu: Menu
  actions: MenuActions
  onNotice: (message: string) => void
}

export function Footer({ menu, actions, onNotice }: FooterProps) {
  const { update } = actions

  return (
    <footer className="footer">
      <div className="takeaway">
        <svg
          className="brush-bar"
          viewBox="0 0 415 62"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M1 12 Q38 1 96 5 Q170 -2 250 3 Q332 -1 410 7 Q415 26 408 46
               Q360 60 286 56 Q200 63 122 57 Q50 61 6 52 Q-2 31 1 12 Z"
          />
        </svg>
        <span className="takeaway-content">
          <svg className="bowl-icon" viewBox="0 0 34 30" fill="none" aria-hidden="true">
            <path
              d="M11 4 q3 3 0 6 M17 2 q3 3 0 6 M23 4 q3 3 0 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <path
              d="M3 15 h28 q-1 11 -14 11 T3 15 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path d="M1 15 h32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <EditableText
            className="takeaway-text"
            value={menu.footer.takeaway}
            onCommit={(next) => {
              update((m) => {
                m.footer.takeaway = next
              })
            }}
          />
        </span>
      </div>

      <div className="fb-bar">
        <svg
          className="brush-bar"
          viewBox="0 0 640 62"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M2 11 Q58 0 150 4 Q270 -2 390 3 Q512 -1 637 8 Q642 28 634 48
               Q540 61 420 57 Q300 63 180 58 Q78 62 7 53 Q-2 30 2 11 Z"
          />
        </svg>
        <span className="fb-content">
          <svg className="fb-icon" viewBox="0 0 32 32" aria-hidden="true">
            <rect className="fb-tile" width="32" height="32" rx="5" />
            <path
              d="M20.5 16.6h-3.1V27h-4.3V16.6H11v-3.7h2.1v-2.4c0-1.8.9-4.5 4.5-4.5h3.2v3.6h-2.3c-.4 0-1 .2-1 1.1v2.2h3.4l-.4 3.7Z"
              className="fb-glyph"
            />
          </svg>
          <EditableText
            className="fb-text"
            value={menu.footer.facebook}
            onCommit={(next) => {
              update((m) => {
                m.footer.facebook = next
              })
            }}
          />
        </span>
      </div>

      <PhotoSlot
        className="photo photo-left"
        slot="left"
        photo={menu.photos.left}
        width={210}
        height={166}
        placeholder={placeholderLeft}
        onNotice={onNotice}
        onPick={(photo) => {
          update((m) => {
            m.photos.left = photo
          })
        }}
      />
      <PhotoSlot
        className="photo photo-right"
        slot="right"
        photo={menu.photos.right}
        width={271}
        height={167}
        placeholder={placeholderRight}
        onNotice={onNotice}
        onPick={(photo) => {
          update((m) => {
            m.photos.right = photo
          })
        }}
      />
    </footer>
  )
}
