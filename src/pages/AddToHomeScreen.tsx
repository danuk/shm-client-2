import { useEffect } from 'react';
import { config } from '../config';

function detectDevice() {
  const ua = navigator.userAgent;
  const isIPad = ua.includes('iPad') || (ua.includes('Macintosh') && 'ontouchend' in document);
  const isIPhone = !isIPad && ua.includes('iPhone');
  return { isIPad, isIPhone };
}

function getIOSVersion(ua: string): number {
  const match = ua.match(/(?:iPhone|CPU) OS (\d+)_/);
  return match ? parseInt(match[1]) : 0;
}

export default function AddToHomeScreen() {
  const { isIPad, isIPhone } = detectDevice();
  const ua = navigator.userAgent;
  const iosVer = getIOSVersion(ua);

  let poffset = -10000;
  let loffset = -10000;

  if (isIPad) {
    if (iosVer >= 14) loffset = 147;
    else if (iosVer >= 12) loffset = 141;
    const minw = Math.min(window.screen.width, window.screen.height);
    if (iosVer >= 15) poffset = minw > 1000 ? 140 : 118;
    else if (iosVer >= 13) poffset = 132;
  } else if (isIPhone) {
    if (iosVer >= 15) loffset = 122;
    else if (iosVer >= 12) loffset = 113;
  }

  const appName = config.APP_NAME;

  useEffect(() => {
    document.title = appName;
  }, [appName]);

  const rootClass = isIPad ? 'pwa-root is-ipad' : isIPhone ? 'pwa-root is-iphone' : 'pwa-root';

  return (
    <>
      <style>{`
        .pwa-root { --accent-color: #007aff; --accent-background: #007aff1f; --device-color: #c4c4c6; }
        @media (prefers-color-scheme: dark) {
          .pwa-root { --accent-color: #0a84ff; --accent-background: #0a84ff1f; --device-color: #5a5a5e; }
        }
        .pwa-root, .pwa-root * { box-sizing: border-box; }
        .pwa-section { display: flex; flex-direction: column; align-items: center; min-height: 100vh; justify-content: center; }
        .pwa-device { margin: 40px 30px 0; }
        .pwa-device > svg { vertical-align: top; max-width: 100%; color: var(--device-color); }
        .pwa-device.ipad { display: none; }
        .is-ipad .pwa-device.ipad { display: block; }
        .is-ipad .pwa-device.iphone { display: none; }
        .pwa-content { text-align: center; display: flex; flex-direction: column; margin: 32px 20px 100px; }
        .pwa-content h1 { font-size: 22px; font-weight: 600; line-height: 26px; margin: 0; padding: 0; }
        .pwa-content ol { margin: 32px 0 0; padding: 0; text-align: left; align-self: center; }
        .pwa-content ol > li { padding-left: 2px; }
        .pwa-content ol > li > b { font-weight: 500; color: var(--accent-color); }
        .pwa-bottom-tips { display: none; }
        .pwa-icon { display: inline-block; width: 20px; height: 28px; vertical-align: top; margin: 0 2px; }
        .pwa-add-icon { margin-right: 0; }
        @media (orientation: landscape) {
          .is-iphone .pwa-section { flex-direction: row; }
          .is-iphone .pwa-device { align-self: flex-end; }
          .is-iphone .pwa-device > svg { height: 75vh; transform: translateY(5px); }
          .is-iphone .pwa-content { text-align: left; margin: 70px 20px 32px 0; }
          .is-iphone .pwa-content ol { align-self: flex-start; }
        }
        @media (orientation: portrait) {
          .is-iphone .pwa-bottom-tips { display: block; }
          .is-iphone .pwa-tool-tips { display: none; }
        }
      `}</style>
      <div
        className={rootClass}
        style={{
          fontFamily: 'system-ui, -apple-system, sans-serif',
          WebkitFontSmoothing: 'antialiased',
          fontSize: 17,
          fontWeight: 500,
          lineHeight: '28px',
          margin: 0,
          padding: 0,
          userSelect: 'none',
          ['--poffset' as any]: poffset + 'px',
          ['--loffset' as any]: loffset + 'px',
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" style={{ position: 'absolute', width: 0, height: 0, left: -10000 }}>
          <defs>
            <path id="pwa-icon-add" d="M16.72 7.28c.86.86 1.02 2.03 1.02 3.54v6.37c0 1.52-.16 2.69-1.02 3.54-.85.85-2.03 1.01-3.54 1.01H6.81c-1.51 0-2.69-.16-3.55-1.01-.85-.85-1-2.02-1-3.54V10.8c0-1.49.15-2.66 1.01-3.52.84-.84 2.03-1.01 3.52-1.01h6.39c1.51 0 2.69.16 3.54 1.01Zm-.61 3.32c0-.87-.11-1.66-.57-2.12-.47-.47-1.27-.59-2.13-.59H6.6c-.87 0-1.69.12-2.15.58-.46.47-.57 1.26-.57 2.14v6.81c0 .86.11 1.65.58 2.12.46.46 1.27.58 2.12.58h6.83c.86 0 1.66-.12 2.13-.58.45-.47.57-1.26.57-2.12V10.6ZM6.17 14.01c0-.47.31-.79.78-.79H9.22V10.94c0-.46.32-.78.77-.78.46 0 .79.32.79.78v2.28h2.28c.46 0 .78.32.78.79 0 .45-.33.76-.78.76H10.78v2.28c0 .46-.33.78-.79.78-.45 0-.77-.32-.77-.78V14.77H6.95c-.46 0-.78-.31-.78-.76Z" fill="currentColor" />
            <path id="pwa-icon-share" d="M5.22 22.81h9.55c1.8 0 2.73-.92 2.73-2.69V11.95c0-1.77-.93-2.69-2.73-2.69h-2.4v1.63h2.3c.77 0 1.2.39 1.2 1.2v7.89c0 .81-.43 1.21-1.2 1.21H5.32c-.77 0-1.2-.4-1.2-1.21V12.09c0-.81.43-1.2 1.2-1.2H7.63V9.26H5.22c-1.79 0-2.72.92-2.72 2.69v8.17c0 1.77.93 2.69 2.72 2.69ZM9.99 16.2c.42 0 .77-.35.77-.76V7.08L10.7 5.85l.51.6L12.38 7.7c.14.15.33.22.52.22.37 0 .68-.27.68-.66 0-.2-.08-.35-.22-.49L10.57 4.09c-.19-.2-.37-.27-.58-.27-.2 0-.38.07-.57.27L6.63 6.77c-.14.14-.22.29-.22.49 0 .39.3.66.68.66.19 0 .39-.07.52-.22L8.77 6.45l.52-.6-.06 1.23v8.36c0 .41.35.76.76.76Z" fill="currentColor" />
          </defs>
        </svg>

        <section className="pwa-section">
          <div className="pwa-device iphone">
            <svg width="294" height="323" viewBox="0 0 294 323" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="pwa-icon-app-iphone" patternUnits="objectBoundingBox" width="1" height="1">
                  <image href="/icon-192.png" x="0" y="0" width="120" height="120" />
                </pattern>
              </defs>
              <g fill="currentColor" stroke="currentColor" opacity="0.3">
                <path d="M 0.5 319.01 C 0.5 321.21 2.3 323 4.51 323 C 6.72 323 8.5 321.2 8.5 318.99 L 0.5 319.01 Z M 286 319 C 286 321.21 287.79 323 290 323 C 292.21 323 294 321.21 294 319 H 286 Z M 8.5 318.99 L 8.08 54.07 L 0.08 54.09 L 0.5 319.01 L 8.5 318.99 Z M 54.08 8 H 240 V 0 H 54.08 V 8 Z M 286 54 V 319 H 294 V 54 H 286 Z M 240 8 C 265.4 8 286 28.59 286 54 H 294 C 294 24.18 269.82 0 240 0 V 8 Z M 8.08 54.07 C 8.04 28.64 28.65 8 54.08 8 V 0 C 24.22 0 0.03 24.23 0.08 54.09 L 8.08 54.07 Z" />
                <rect x="21.5" y="71.5" width="53" height="53" rx="15.5" /><rect x="21.5" y="269.5" width="53" height="53" rx="15.5" />
                <rect x="21.5" y="137.5" width="53" height="53" rx="15.5" /><rect x="21.5" y="203.5" width="53" height="53" rx="15.5" />
                <rect x="87.5" y="71.5" width="53" height="53" rx="15.5" /><rect x="87.5" y="269.5" width="53" height="53" rx="15.5" />
                <rect x="153.5" y="71.5" width="53" height="53" rx="15.5" /><rect x="153.5" y="269.5" width="53" height="53" rx="15.5" />
                <rect x="219.5" y="71.5" width="53" height="53" rx="15.5" /><rect x="219.5" y="269.5" width="53" height="53" rx="15.5" />
                <rect x="219.5" y="137.5" width="53" height="53" rx="15.5" /><rect x="219.5" y="203.5" width="53" height="53" rx="15.5" />
                <rect x="102.5" y="16.5" width="89" height="25" rx="12.5" />
                <rect x="87.5" y="137.5" width="120" height="120" rx="36" stroke="none" />
              </g>
              <rect x="87.5" y="137.5" width="120" height="120" rx="36" fill="url(#pwa-icon-app-iphone)" />
            </svg>
          </div>

          <div className="pwa-device ipad">
            <svg width="444" height="284" viewBox="0 0 444 284" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="pwa-icon-app-ipad" patternUnits="objectBoundingBox" width="1" height="1">
                  <image href="/icon-192.png" x="0" y="0" width="120" height="120" />
                </pattern>
              </defs>
              <g fill="currentColor" stroke="currentColor" opacity="0.3">
                <path d="M.5 278.01c.01 3.31 2.7 6 6.01 5.99s6-2.7 5.99-6.01l-12 .02ZM432 278c0 3.31 2.69 6 6 6s6-2.69 6-6H432Zm-419.5-.01L12.07 46.06.07 46.08.5 278.01l12-.02ZM46.07 12H398V0H46.07V12ZM432 46V278h12V46H432ZM398 12c18.78 0 34 15.22 34 34h12c0-25.41-20.6-46-46-46V12ZM12.07 46.06C12.04 27.26 27.27 12 46.07 12V0C20.64 0 .03 20.65.07 46.08l12-.02Z" />
                <rect x="96.5" y="30.5" width="53" height="53" rx="15.5" /><rect x="30.5" y="30.5" width="53" height="53" rx="15.5" />
                <rect x="96.5" y="228.5" width="53" height="53" rx="15.5" /><rect x="30.5" y="228.5" width="53" height="53" rx="15.5" />
                <rect x="96.5" y="96.5" width="53" height="53" rx="15.5" /><rect x="30.5" y="96.5" width="53" height="53" rx="15.5" />
                <rect x="96.5" y="162.5" width="53" height="53" rx="15.5" /><rect x="30.5" y="162.5" width="53" height="53" rx="15.5" />
                <rect x="162.5" y="30.5" width="53" height="53" rx="15.5" /><rect x="162.5" y="228.5" width="53" height="53" rx="15.5" />
                <rect x="228.5" y="30.5" width="53" height="53" rx="15.5" /><rect x="228.5" y="228.5" width="53" height="53" rx="15.5" />
                <rect x="294.5" y="30.5" width="53" height="53" rx="15.5" /><rect x="360.5" y="30.5" width="53" height="53" rx="15.5" />
                <rect x="294.5" y="228.5" width="53" height="53" rx="15.5" /><rect x="360.5" y="228.5" width="53" height="53" rx="15.5" />
                <rect x="294.5" y="96.5" width="53" height="53" rx="15.5" /><rect x="360.5" y="96.5" width="53" height="53" rx="15.5" />
                <rect x="294.5" y="162.5" width="53" height="53" rx="15.5" /><rect x="360.5" y="162.5" width="53" height="53" rx="15.5" />
                <rect x="161.5" y="96" width="120" height="120" rx="36" stroke="none" />
              </g>
              <rect x="161.5" y="96" width="120" height="120" rx="36" fill="url(#pwa-icon-app-ipad)" />
            </svg>
          </div>

          <div className="pwa-content">
            <h1>Добавьте {appName} на экран «Домой»</h1>
            <ol className="pwa-tool-tips">
              <li>
                Нажмите{' '}
                <b>
                  <svg className="pwa-icon">
                    <use href="#pwa-icon-share" />
                  </svg>
                </b>{' '}
                в панели инструментов
              </li>
              <li>
                Выберите{' '}
                <b>
                  <svg className="pwa-icon pwa-add-icon">
                    <use href="#pwa-icon-add" />
                  </svg>{' '}
                  На экран «Домой»
                </b>
              </li>
            </ol>
            <ol className="pwa-bottom-tips">
              <li>
                Нажмите{' '}
                <b>
                  <svg className="pwa-icon">
                    <use href="#pwa-icon-share" />
                  </svg>
                </b>{' '}
                в нижней панели
              </li>
              <li>
                Выберите{' '}
                <b>
                  <svg className="pwa-icon pwa-add-icon">
                    <use href="#pwa-icon-add" />
                  </svg>{' '}
                  На экран «Домой»
                </b>
              </li>
            </ol>
          </div>
        </section>
      </div>
    </>
  );
}
