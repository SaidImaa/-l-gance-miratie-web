/** Packshots SVG de secours (navigateurs sans WebGL). */
export function svgPackshot(p, type = 'bottle') {
  const body =
    type === 'vial'
      ? `<rect x="182" y="210" width="36" height="250" rx="10" fill="url(#g)" stroke="#f3dca6" stroke-opacity=".5"/>
         <rect x="186" y="290" width="28" height="166" rx="7" fill="${p.liquid}"/>
         <rect x="180" y="150" width="40" height="64" rx="4" fill="url(#gold)"/>`
      : `<path d="M140 250 L160 230 L240 230 L260 250 L262 440 L248 460 L152 460 L138 440 Z" fill="url(#g)" stroke="#f3dca6" stroke-opacity=".55"/>
         <path d="M150 300 L250 300 L252 438 L242 452 L158 452 L148 438 Z" fill="${p.liquid}" opacity=".95"/>
         <rect x="182" y="208" width="36" height="24" fill="url(#gold)"/>
         <path d="M178 208 C176 170 190 140 200 112 C210 140 224 170 222 208 Z" fill="url(#gold)"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">
    <defs>
      <radialGradient id="bg" cx="50%" cy="55%" r="60%"><stop offset="0" stop-color="${p.accent}" stop-opacity=".35"/><stop offset="1" stop-color="#070504"/></radialGradient>
      <linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".5" stop-color="#fff" stop-opacity=".04"/><stop offset="1" stop-color="#fff" stop-opacity=".22"/></linearGradient>
      <linearGradient id="gold" x1="0" x2="1"><stop offset="0" stop-color="#8a6229"/><stop offset=".45" stop-color="#f7e4b3"/><stop offset="1" stop-color="#9c7434"/></linearGradient>
    </defs>
    <rect width="400" height="500" fill="url(#bg)"/>
    <ellipse cx="200" cy="466" rx="90" ry="10" fill="#000" opacity=".4"/>
    ${body}
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
