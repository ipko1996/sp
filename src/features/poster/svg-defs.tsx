/** Botanical shapes shared by the artwork, defined once so their ids stay unique however many
 *  times the branch repeats them. Lives inside `.poster` so a PNG export carries it along. */
export function SvgDefs() {
  return (
    <svg className="svg-defs" aria-hidden="true" focusable="false">
      <defs>
        <path id="olive-blade" d="M0 0 C7 -8 20 -11 32 -6 C22 3 9 6 0 0 Z" />
        <g id="olive-blade-veined">
          <use href="#olive-blade" />
          <path d="M2 -1 C11 -3 21 -5 30 -6" strokeWidth="1" opacity=".75" />
        </g>
      </defs>
    </svg>
  )
}
