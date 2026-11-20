# COURT SCRIBE — บันทึกบัลลังก์

> **Play Online Now (เล่นฟรีบนเว็บทันที):** https://nikka230.github.io/court-scribe/

A **Noir-Victorian Courtroom Stenographer** touch-typing game for practicing **Thai (Kedmanee)** and **English (QWERTY + Reading & Thai Translation)** — 100% client-side static web app with zero backend required.

เกมฝึกพิมพ์สัมผัส **ภาษาไทย (แป้นเกษมณี)** และ **ภาษาอังกฤษพร้อมฝึกอ่าน–ฝึกแปลไทย** ในบรรยากาศผู้ช่วยเสมียนจดบันทึกประจำศาล ทำงานบนเบราว์เซอร์ 100% ไม่ต้องมีเซิร์ฟเวอร์

---

## Highlights / ฟีเจอร์เด่น

- **Thai Kedmanee & English QWERTY 3D Keyboard Guide:** Real-time next-key glow, Left/Right Shift ergonomics, 10-finger hand silhouette guide, grapheme-safe Thai combining mark rendering (`Intl.Segmenter`), wrong-layout detector, and **Auto-Layout Mode** (type Thai/English without switching OS IME).
- **English Reading & Translation Practice (EN → TH):**
  - Inline Thai sentence translations with 3 modes: **Visible**, **Peek on `Tab` / Hover**, and **Blind Challenge**
  - **Click any word** for IPA phonetics, Thai translation, English definition, and audio pronunciation (Web Speech API)
  - Personal **Vocabulary Ledger** with interactive **Flip Flashcard Review** + post-session comprehension quiz
- **Zero-Backend Content Sources:**
  - Built-in dramatic **Courtroom Case Dossiers** (TH & EN) + touch-typing finger drills
  - **YouTube Transcript Mode:** Embeds live witness video monitor with timestamp sync (supports auto caption lookup, 1-click YouTube transcript paste, and `.SRT` / `.VTT` upload)
  - **Live Wikipedia (TH / EN):** Paste any Wikipedia URL or search live directly via Wikimedia CORS API
  - **Smart Randomizer:** Live random Wikipedia articles + curated offline knowledge library
  - **Custom Text / File Import:** Paste any text or upload `.TXT`, `.SRT`, `.VTT`
- **Procedural Courtroom Audio (Web Audio API):** Synthesized vintage brass typewriter strikes, mechanical thock switch, carriage return bell, wooden gavel strikes, and wax-seal verdict stamp.

---

## Run Locally / รันและพัฒนาต่อในเครื่อง

```bash
npm install
npm run dev            # Development server
npm run build          # Static web build (dist/)
npm run build:portable # Self-contained single-file HTML (dist-portable/index.html)
```

## License

MIT License — feel free to play, share, star, or fork!
