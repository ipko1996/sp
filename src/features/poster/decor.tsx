/**
 * Olive branch and parsley sprig: a tapering stem with leaves built from two mirrored arcs and a
 * midrib, alternating along the stem and varied in scale so the branch reads as drawn rather than
 * tiled. Design chrome — nothing here is driven by the menu.
 */
export function Decor() {
  return (
    <>
      <svg
        className="decor decor-branch"
        viewBox="0 0 290 130"
        fill="none"
        aria-hidden="true"
        data-decor="branch"
      >
        <g className="branch-stem" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M290 8 C247 14 208 27 172 44 C140 59 110 72 78 80" />
          <path d="M247 20 C224 38 205 59 190 82 C182 95 177 106 174 116" />
          <path d="M290 46 C258 56 230 70 205 88" />
        </g>

        <g className="branch-outline">
          <use href="#olive-blade-veined" transform="translate(255 10) rotate(200) scale(.95)" />
          <use href="#olive-blade-veined" transform="translate(221 22) rotate(206)" />
          <use href="#olive-blade-veined" transform="translate(188 36) rotate(210) scale(1.05)" />
          <use href="#olive-blade-veined" transform="translate(155 51) rotate(214)" />
          <use href="#olive-blade-veined" transform="translate(122 65) rotate(218) scale(.95)" />
          <use href="#olive-blade-veined" transform="translate(238 30) rotate(338) scale(.9)" />
          <use href="#olive-blade-veined" transform="translate(205 45) rotate(342)" />
          <use href="#olive-blade-veined" transform="translate(172 60) rotate(346) scale(.95)" />
          <use href="#olive-blade-veined" transform="translate(196 74) rotate(268) scale(.85)" />
          <use href="#olive-blade-veined" transform="translate(183 100) rotate(272) scale(.8)" />
        </g>

        <g className="branch-solid">
          <use href="#olive-blade" transform="translate(283 18) rotate(160) scale(1.15)" />
          <use href="#olive-blade" transform="translate(262 36) rotate(166) scale(1.2)" />
          <use href="#olive-blade" transform="translate(236 54) rotate(170) scale(1.1)" />
          <use href="#olive-blade" transform="translate(286 62) rotate(176) scale(1.05)" />
          <use href="#olive-blade" transform="translate(262 80) rotate(180)" />
          <use href="#olive-blade" transform="translate(212 74) rotate(174) scale(.95)" />
        </g>
      </svg>

      <svg
        className="decor decor-parsley"
        viewBox="0 0 48 44"
        fill="none"
        aria-hidden="true"
        data-decor="parsley"
      >
        <path
          className="parsley-stem"
          d="M24 43 C25 33 27 25 31 18"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path className="parsley-dark" d="M29 22 C21 22 15 18 11 11 C20 8 27 13 29 20 Z" />
        <path className="parsley-light" d="M32 18 C40 16 45 11 47 4 C38 3 32 9 31 16 Z" />
        <path className="parsley-dark" d="M31 15 C29 7 32 2 39 0 C40 8 36 14 30 16 Z" />
        <path
          className="parsley-stem"
          d="M26 30 C19 31 13 28 9 23"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    </>
  )
}
