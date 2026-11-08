# INNOSTES brand assets

Single source for the logo across the product (web-app), the website (landing) and the docs.
Import through the package export, e.g. `import logo from '@innostes/ui/brand/innostes-wordmark-on-dark.png'`.

| File | Use on | Notes |
|---|---|---|
| `innostes-logo-on-light.png` | White / light surfaces, large sizes (login, hero, docs) | Original artwork from innostes.com, wordmark + symbol + tagline |
| `innostes-logo-on-dark.png` | Midnight Navy / dark surfaces, large sizes | Derived from the original: black wordmark recoloured to white, sky-blue symbol unchanged |
| `innostes-wordmark-on-light.png` | Light surfaces at small sizes (header, top bar) | Original without the tagline (illegible below ~48px height) |
| `innostes-wordmark-on-dark.png` | Navy sidebar, navy footer at small sizes | As above, white wordmark |
| `innostes-symbol.png` | Collapsed sidebar, favicon, app icons (light) | Head + bulb symbol only, square, padded |
| `innostes-symbol-on-dark.png` | Symbol on navy | Bulb recoloured to white |
| `innostes-logo-white-original.svg` | **Not used** | Supplied white SVG. Its wordmark is live text in *Nexa Bold* / *Montserrat* (not outlined), so it renders in a fallback font. Re-export with outlined text to use it. |

Logo colours (sky blue `#00A8EC`, black `#121212`) appear **only inside the logo**. They are not UI colours;
the interactive brand colour is Executive Blue `#3157D5` (see `tailwind/theme.css`).
