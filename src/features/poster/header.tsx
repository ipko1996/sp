import { EditableText } from '../../components/editable-text.tsx'
import { currentWeek, shiftWeek } from '../../lib/week.ts'
import type { MenuActions } from '../menu/use-menu.ts'
import type { Menu } from '../../types/menu.ts'

interface HeaderProps {
  menu: Menu
  actions: MenuActions
}

export function Header({ menu, actions }: HeaderProps) {
  const { update } = actions

  return (
    <header className="header">
      <svg className="logo" viewBox="0 0 82 81" aria-hidden="true">
        {/* Ring broken at roughly one o'clock. A dash gap positioned by rotation is easier to
            adjust than a hand-built arc. */}
        <circle
          cx="41"
          cy="40.5"
          r="36.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="4.4"
          strokeLinecap="round"
          strokeDasharray="197 32"
          transform="rotate(-34 41 40.5)"
        />
        <g fill="currentColor">
          <rect x="23.6" y="19" width="2.7" height="13.5" rx="1.35" />
          <rect x="30.1" y="19" width="2.7" height="13.5" rx="1.35" />
          <rect x="36.6" y="19" width="2.7" height="13.5" rx="1.35" />
          <path
            d="M23.6 30.5 C23.6 36.4 26.6 39.6 29.6 40.6 V59.4
               a1.9 1.9 0 0 0 3.8 0 V40.6 C36.4 39.6 39.4 36.4 39.4 30.5 Z"
          />
          <path
            d="M52.2 19 C57.6 23.4 59.4 30.6 58.7 37.2 C58.4 40.2 56.6 41.8 54.4 42.3 V59.4
               a1.9 1.9 0 0 1-3.8 0 V26.6 C50.6 22.6 51 19.6 52.2 19 Z"
          />
        </g>
      </svg>

      <div className="brand">
        <EditableText
          as="div"
          className="brand-name"
          value={menu.restaurant.name}
          onCommit={(next) => {
            update((m) => {
              m.restaurant.name = next
            })
          }}
        />
        <EditableText
          as="div"
          className="brand-line"
          value={menu.restaurant.city}
          onCommit={(next) => {
            update((m) => {
              m.restaurant.city = next
            })
          }}
        />
        <EditableText
          as="div"
          className="brand-line"
          value={menu.restaurant.address}
          onCommit={(next) => {
            update((m) => {
              m.restaurant.address = next
            })
          }}
        />
        <EditableText
          as="div"
          className="brand-line brand-phone"
          value={menu.restaurant.phone}
          onCommit={(next) => {
            update((m) => {
              m.restaurant.phone = next
            })
          }}
        />
      </div>

      <div className="title-block">
        <div className="rule-top" aria-hidden="true">
          <span className="rule" />
          <svg className="rule-leaf" viewBox="0 0 46 20" aria-hidden="true">
            <path
              d="M23 18 Q19 9 24 3 Q30 9 26 17 Q24 19 23 18 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M22 17 Q13 16 9 9 Q19 6 23 14 Q24 17 22 17 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M25 16 Q34 16 38 9 Q28 5 24 14 Q23 16 25 16 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
          <span className="rule" />
        </div>

        <EditableText
          as="h1"
          className="title"
          value={menu.title}
          onCommit={(next) => {
            update((m) => {
              m.title = next
            })
          }}
        />

        <div className="date-row">
          <span className="date-rule" />
          <EditableText
            className="date"
            value={menu.dateRange}
            placeholder="2026. 08. 31. – 09. 04."
            onCommit={(next) => {
              update((m) => {
                m.dateRange = next
              })
            }}
          />
          <span className="date-rule" />
        </div>

        <div className="edit-only week-nav">
          <button
            type="button"
            title="Előző hét"
            onClick={() => {
              update((m) => {
                m.dateRange = shiftWeek(m.dateRange, -1)
              })
            }}
          >
            ‹ Előző
          </button>
          <button
            type="button"
            title="Aktuális hét"
            onClick={() => {
              update((m) => {
                m.dateRange = currentWeek()
              })
            }}
          >
            Most
          </button>
          <button
            type="button"
            title="Következő hét"
            onClick={() => {
              update((m) => {
                m.dateRange = shiftWeek(m.dateRange, 1)
              })
            }}
          >
            Következő ›
          </button>
        </div>
      </div>

      <div className="badge">
        <svg className="badge-ring" viewBox="0 0 195 195" aria-hidden="true">
          <circle className="badge-disc" cx="97.5" cy="97.5" r="96" />
          {/* hand-drawn inner ring: uneven stroke rather than a clean circle */}
          <path
            d="M97 12 Q158 12 178 62 Q192 108 162 148 Q124 186 74 178 Q22 166 9 112
               Q4 58 46 26 Q68 13 97 12 Z"
            className="badge-ring-line"
            fill="none"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeDasharray="392 26 150 14 96"
            opacity=".92"
          />
        </svg>
        <div className="badge-text">
          {menu.badge.small.map((line, i) => (
            <EditableText
              key={i}
              as="div"
              className="badge-small"
              value={line}
              onCommit={(next) => {
                update((m) => {
                  m.badge.small[i] = next
                })
              }}
            />
          ))}
          <EditableText
            as="div"
            className="badge-large"
            value={menu.badge.large}
            onCommit={(next) => {
              update((m) => {
                m.badge.large = next
              })
            }}
          />
          <div className="badge-medium">
            <EditableText
              value={menu.badge.medium}
              onCommit={(next) => {
                update((m) => {
                  m.badge.medium = next
                })
              }}
            />
            <svg className="badge-leaf" viewBox="0 0 26 20" aria-hidden="true">
              <path
                d="M3 17 Q12 15 22 5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
              <path
                d="M12 12 Q11 5 17 2 Q20 8 15 12 Q13 13 12 12 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
              />
              <path
                d="M11 13 Q5 12 3 7 Q10 5 13 11 Q13 13 11 13 Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
              />
            </svg>
          </div>
        </div>
      </div>
    </header>
  )
}
