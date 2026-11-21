import type { CaseDossier } from '../types/game';

/**
 * Built-in Courtroom Case Dossiers (Thai & English with full natural Thai translations & vocab),
 * Curated Random Knowledge Gems, Touch-Typing Finger Drills, and Ready-to-Play YouTube Presets.
 */
export const BUILT_IN_CASES: CaseDossier[] = [
  // ================= ENGLISH COURTROOM CASES (WITH FULL TRANSLATIONS & VOCAB) =================
  {
    id: 'case-en-midnight-vault',
    caseCode: 'CASE NO. 1894-A',
    title: 'The Midnight Vault Testimony',
    subtitle: 'คดีเพชรสีน้ำเงินหายจากห้องนิรภัยเที่ยงคืน (ฝึกพิมพ์อังกฤษ + อ่านแปล)',
    language: 'en',
    sourceKind: 'court-case',
    difficulty: 'novice',
    category: 'คดีศาลจำลอง (English)',
    summaryTh:
      'การไต่สวนพยานคนสำคัญในคดีโจรกรรมเพชรจากห้องนิรภัยพิพิธภัณฑ์กลางดึก — เน้นศัพท์ศาล การสืบพยาน และโครงสร้างประโยคที่อ่านแปลเข้าใจง่าย',
    lines: [
      {
        id: 'mv-1',
        speaker: 'judge',
        speakerName: 'Presiding Judge',
        text: 'Order in the chamber. The court is now in session for the inquiry of the missing blue diamond.',
        translationTh:
          'โปรดอยู่ในความสงบ ศาลขอเปิดการไต่สวนคดีเพชรสีน้ำเงินที่สูญหาย ณ บัดนี้',
        vocab: [
          { word: 'chamber', ipa: '/ˈtʃeɪm.bər/', pos: 'n.', th: 'ห้องพิจารณาคดี' },
          { word: 'inquiry', ipa: '/ɪnˈkwaɪə.ri/', pos: 'n.', th: 'การไต่สวน, การสอบสวน' },
        ],
      },
      {
        id: 'mv-2',
        speaker: 'prosecutor',
        speakerName: 'Chief Prosecutor',
        text: 'Your Honor, the security ledger shows the vault door opened at exactly twelve minutes past midnight.',
        translationTh:
          'เรียนท่านผู้พิพากษา สมุดบันทึกระบบความปลอดภัยแสดงว่าประตูห้องนิรภัยถูกเปิดตอนเที่ยงคืนสิบสองนาทีพอดีครับ',
        vocab: [
          { word: 'ledger', ipa: '/ˈledʒ.ər/', pos: 'n.', th: 'สมุดบันทึกหลักฐาน/บัญชี' },
          { word: 'vault', ipa: '/vɔːlt/', pos: 'n.', th: 'ห้องนิรภัย' },
        ],
      },
      {
        id: 'mv-3',
        speaker: 'witness',
        speakerName: 'Night Curator',
        text: 'I heard soft footsteps along the east corridor, yet the alarm remained completely silent.',
        translationTh:
          'ผมได้ยินเสียงฝีเท้าเบาๆ ตามโถงทางเดินฝั่งตะวันออก แต่สัญญาณเตือนภัยกลับเงียบสนิทครับ',
        vocab: [
          { word: 'corridor', ipa: '/ˈkɒr.ɪ.dɔːr/', pos: 'n.', th: 'โถงทางเดิน' },
          { word: 'remained', ipa: '/rɪˈmeɪnd/', pos: 'v.', th: 'ยังคงอยู่' },
        ],
      },
      {
        id: 'mv-4',
        speaker: 'defense',
        speakerName: 'Defense Counsel',
        text: 'Objection, Your Honor! The surveillance footage has a four-minute gap that contradicts this timeline.',
        translationTh:
          'ขอคัดค้านครับท่าน! ภาพจากกล้องวงจรปิดมีช่วงเวลาหายไปสี่นาที ซึ่งขัดแย้งกับลำดับเวลานี้อย่างชัดเจน',
        vocab: [
          { word: 'surveillance', ipa: '/sɜːrˈveɪ.ləns/', pos: 'n.', th: 'กล้องวงจรปิด, การเฝ้าระวัง' },
          { word: 'contradicts', ipa: '/ˌkɒn.trəˈdɪkts/', pos: 'v.', th: 'ขัดแย้งกับ' },
        ],
      },
      {
        id: 'mv-5',
        speaker: 'judge',
        speakerName: 'Presiding Judge',
        text: 'Objection sustained. Clerk, please mark the forensic timestamp report as Exhibit B for the official record.',
        translationTh:
          'ศาลรับคำคัดค้าน เสมียนศาล โปรดลงทะเบียนรายงานตราประทับเวลานิติวิทยาศาสตร์เป็นพยานวัตถุ ข. ไว้ในสำนวนทางการ',
        vocab: [
          { word: 'sustained', ipa: '/səˈsteɪnd/', pos: 'v.', th: 'รับคำคัดค้าน' },
          { word: 'exhibit', ipa: '/ɪɡˈzɪb.ɪt/', pos: 'n.', th: 'พยานวัตถุ' },
        ],
      },
    ],
  },
  {
    id: 'case-en-digital-alibi',
    caseCode: 'CASE NO. 2026-C',
    title: 'The Encrypted Digital Alibi',
    subtitle: 'คดีปลอมแปลงหลักฐานดิจิทัลและลายเซ็นเข้ารหัส (ระดับกลาง)',
    language: 'en',
    sourceKind: 'court-case',
    difficulty: 'senior',
    category: 'คดีศาลจำลอง (English)',
    summaryTh:
      'การซักค้านพยานด้านไซเบอร์เกี่ยวกับบันทึกเซิร์ฟเวอร์และลายเซ็นดิจิทัลที่ถูกแก้ไข — ฝึกศัพท์เทคนิคผสมกฎหมาย',
    lines: [
      {
        id: 'da-1',
        speaker: 'prosecutor',
        speakerName: 'Cyber Prosecutor',
        text: 'Every encrypted backup server automatically records a cryptographic signature when a file is altered.',
        translationTh:
          'เซิร์ฟเวอร์สำรองข้อมูลที่เข้ารหัสทุกเครื่องจะบันทึกลายเซ็นเชิงรหัสโดยอัตโนมัติเมื่อไฟล์ถูกแก้ไข',
        vocab: [
          { word: 'encrypted', ipa: '/ɪnˈkrɪp.tɪd/', pos: 'adj.', th: 'ถูกเข้ารหัสลับ' },
          { word: 'altered', ipa: '/ˈɔːl.tərd/', pos: 'v.', th: 'ถูกดัดแปลงแก้ไข' },
        ],
      },
      {
        id: 'da-2',
        speaker: 'defense',
        speakerName: 'Defense Counsel',
        text: 'Look closely at the discrepancy between the local clock and the cloud archive: the document was never forged.',
        translationTh:
          'ลองพิจารณาความคลาดเคลื่อนระหว่างนาฬิกาเครื่องกับคลังข้อมูลคลาวด์ให้ดีครับ เอกสารนี้ไม่เคยถูกปลอมแปลงเลย',
        vocab: [
          { word: 'discrepancy', ipa: '/dɪˈskrep.ən.si/', pos: 'n.', th: 'ความคลาดเคลื่อนผิดปกติ' },
          { word: 'forged', ipa: '/fɔːrdʒd/', pos: 'v./adj.', th: 'ถูกปลอมแปลง' },
        ],
      },
      {
        id: 'da-3',
        speaker: 'witness',
        speakerName: 'Forensic Analyst',
        text: 'Upon careful inspection, I can confirm the integrity of the original log remains authentic beyond reasonable doubt.',
        translationTh:
          'จากการตรวจสอบอย่างละเอียด ผมขอยืนยันว่าความสมบูรณ์ของบันทึกต้นฉบับยังคงเป็นของแท้โดยปราศจากข้อสงสัยอันสมควรครับ',
        vocab: [
          { word: 'integrity', ipa: '/ɪnˈteɡ.rə.ti/', pos: 'n.', th: 'ความสมบูรณ์ไม่ถูกแก้ไข' },
          { word: 'authentic', ipa: '/ɔːˈθen.tɪk/', pos: 'adj.', th: 'ของแท้ตามจริง' },
        ],
      },
      {
        id: 'da-4',
        speaker: 'judge',
        speakerName: 'Presiding Judge',
        text: 'Precision in every record protects the innocent and illuminates the truth. Let the final verdict be entered.',
        translationTh:
          'ความเที่ยงตรงในทุกบันทึกย่อมคุ้มครองผู้บริสุทธิ์และส่องสว่างให้เห็นความจริง ให้จดบันทึกคำพิพากษาขั้นสุดท้ายลงสำนวนได้',
        vocab: [
          { word: 'precision', ipa: '/prɪˈsɪʒ.ən/', pos: 'n.', th: 'ความเที่ยงตรงแม่นยำ' },
          { word: 'illuminates', ipa: '/ɪˈluː.mɪ.neɪts/', pos: 'v.', th: 'ส่องสว่าง, ทำให้กระจ่าง' },
        ],
      },
    ],
  },
  {
    id: 'case-en-legal-wisdom',
    caseCode: 'ARCHIVE 042-EN',
    title: 'Principles of Fair Judgment & Reading',
    subtitle: 'หลักนิติธรรมและการอ่านอย่างมีวิจารณญาณ (ฝึกอ่าน-แปลระดับสูง)',
    language: 'en',
    sourceKind: 'court-case',
    difficulty: 'supreme',
    category: 'วรรณกรรม & ความรู้ (English)',
    summaryTh:
      'บทความเชิงปรัชญาว่าด้วยความยุติธรรม วินัยการฝึกฝน และพลังของการอ่านอย่างเข้าใจบริบท',
    lines: [
      {
        id: 'lw-1',
        speaker: 'judge',
        speakerName: 'Chief Justice',
        text: 'Impartial justice begins when we suspend hasty assumptions and listen patiently to every perspective.',
        translationTh:
          'ความยุติธรรมที่เป็นกลางเริ่มต้นขึ้นเมื่อเราหยุดการด่วนสรุป และรับฟังทุกมุมมองอย่างอดทน',
        vocab: [
          { word: 'impartial', ipa: '/ɪmˈpɑːr.ʃəl/', pos: 'adj.', th: 'เป็นกลาง, ไร้ซึ่งอคติ' },
          { word: 'assumptions', ipa: '/əˈsʌmp.ʃənz/', pos: 'n.', th: 'การทึกทัก, สมมติฐาน' },
        ],
      },
      {
        id: 'lw-2',
        speaker: 'defense',
        speakerName: 'Legal Scholar',
        text: 'True language mastery grows through deliberate practice: typing with calm rhythm while absorbing meaning in context.',
        translationTh:
          'ความเชี่ยวชาญทางภาษาที่แท้จริงเติบโตจากการฝึกฝนอย่างตั้งใจ คือการพิมพ์ด้วยจังหวะที่สงบนิ่งพร้อมซึมซับความหมายตามบริบท',
        vocab: [
          { word: 'deliberate', ipa: '/dɪˈlɪb.ər.ət/', pos: 'adj.', th: 'อย่างตั้งใจและรอบคอบ' },
          { word: 'context', ipa: '/ˈkɒn.tekst/', pos: 'n.', th: 'บริบท' },
        ],
      },
      {
        id: 'lw-3',
        speaker: 'witness',
        speakerName: 'Archivist',
        text: 'Consistent small habits build remarkable resilience, turning unfamiliar vocabulary into fluent comprehension.',
        translationTh:
          'นิสัยเล็กๆ ที่ทำอย่างสม่ำเสมอสร้างความแข็งแกร่งได้อย่างน่าทึ่ง เปลี่ยนคำศัพท์ที่ไม่คุ้นเคยให้กลายเป็นความเข้าใจที่คล่องแคล่ว',
        vocab: [
          { word: 'resilience', ipa: '/rɪˈzɪl.jəns/', pos: 'n.', th: 'ความยืดหยุ่นและความแกร่งทางใจ' },
          { word: 'comprehension', ipa: '/ˌkɒm.prɪˈhen.ʃən/', pos: 'n.', th: 'ความเข้าใจในการอ่าน' },
        ],
      },
    ],
  },

  // ================= THAI COURTROOM CASES =================
  {
    id: 'case-th-gala-diamond',
    caseCode: 'คดีหมายเลขดำ อ.๑๔๒/๖๙',
    title: 'สำนวนคดีปริศนาเพชรหายกลางงานกาล่า',
    subtitle: 'การเบิกความในห้องพิจารณาคดี — ฝึกพิมพ์สัมผัสภาษาไทยและวรรณยุกต์',
    language: 'th',
    sourceKind: 'court-case',
    difficulty: 'novice',
    category: 'คดีศาลจำลอง (ภาษาไทย)',
    summaryTh:
      'บันทึกถ้อยคำการไต่สวนคดีของมีค่าหายในหอศิลป์ ฝึกความคล่องแคล่วของแป้นเหย้า สระบน-ล่าง และวรรณยุกต์ภาษาไทย',
    lines: [
      {
        id: 'th-gd-1',
        speaker: 'judge',
        speakerName: 'ท่านผู้พิพากษา',
        text: 'ศาลขอเปิดการพิจารณาคดี ณ บัดนี้ ขอให้ทุกฝ่ายอยู่ในความสงบ และให้เสมียนศาลจดบันทึกคำให้การอย่างละเอียดถี่ถ้วน',
      },
      {
        id: 'th-gd-2',
        speaker: 'prosecutor',
        speakerName: 'พนักงานอัยการ',
        text: 'ข้าแต่ศาลที่เคารพ จากหลักฐานบันทึกการเข้าออกอาคาร พบว่าไฟในห้องจัดแสดงดับลงเป็นเวลาสามนาทีก่อนเกิดเหตุ',
      },
      {
        id: 'th-gd-3',
        speaker: 'witness',
        speakerName: 'พยานฝ่ายหอศิลป์',
        text: 'ในคืนนั้นผมเดินตรวจความเรียบร้อยตามปกติ แต่สังเกตเห็นเงาคนเดินผ่านระเบียงด้านทิศเหนืออย่างรวดเร็วครับ',
      },
      {
        id: 'th-gd-4',
        speaker: 'defense',
        speakerName: 'ทนายฝ่ายจำเลย',
        text: 'ขอคัดค้านครับท่าน คำให้การดังกล่าวเป็นเพียงการคาดเดา เนื่องจากกล้องวงจรปิดยืนยันว่าจำเลยอยู่ที่ห้องสมุดในเวลาเดียวกัน',
      },
      {
        id: 'th-gd-5',
        speaker: 'judge',
        speakerName: 'ท่านผู้พิพากษา',
        text: 'ศาลรับคำคัดค้าน ให้บันทึกข้อสังเกตของฝ่ายจำเลยลงในสำนวน และเบิกพยานหลักฐานลำดับถัดไปเพื่อพิสูจน์ข้อเท็จจริง',
      },
    ],
  },
  {
    id: 'case-th-digital-contract',
    caseCode: 'คดีหมายเลขดำ พ.๓๐๘/๖๙',
    title: 'คดีพิพาทสัญญาซอฟต์แวร์และหลักฐานดิจิทัล',
    subtitle: 'ฝึกพิมพ์ภาษาไทยระดับกลาง — ศัพท์เทคโนโลยี กฎหมาย และปุ่ม Shift',
    language: 'th',
    sourceKind: 'court-case',
    difficulty: 'senior',
    category: 'คดีศาลจำลอง (ภาษาไทย)',
    summaryTh:
      'สำนวนการพิจารณาข้อพิพาทลิขสิทธิ์โค้ดโปรแกรมและข้อมูลบันทึกเวลา ฝึกสลับนิ้วระหว่างตัวอักษรปกติและอักษรยกแคร่ (Shift)',
    lines: [
      {
        id: 'th-dc-1',
        speaker: 'prosecutor',
        speakerName: 'ทนายโจทก์',
        text: 'เอกสารชุดนี้คือบันทึกประวัติการแก้ไขโค้ดต้นฉบับ ซึ่งระบุวันเวลาและลายเซ็นดิจิทัลของผู้พัฒนาไว้อย่างชัดเจน',
      },
      {
        id: 'th-dc-2',
        speaker: 'witness',
        speakerName: 'ผู้เชี่ยวชาญนิติวิทยาไซเบอร์',
        text: 'จากการตรวจสอบค่าแฮชของไฟล์ทั้งสองชุด พบว่าโครงสร้างอัลกอริทึมมีความสอดคล้องกันเกินร้อยละเก้าสิบห้าครับ',
      },
      {
        id: 'th-dc-3',
        speaker: 'defense',
        speakerName: 'ทนายฝ่ายจำเลย',
        text: 'อย่างไรก็ตาม ชุดคำสั่งพื้นฐานเหล่านั้นเป็นไลบรารีโอเพนซอร์สที่นักพัฒนาทั่วโลกสามารถนำมาประยุกต์ใช้งานได้อย่างเสรี',
      },
      {
        id: 'th-dc-4',
        speaker: 'judge',
        speakerName: 'ท่านผู้พิพากษา',
        text: 'ข้อเท็จจริงนี้มีน้ำหนักสำคัญต่อการวินิจฉัย ศาลจึงสั่งให้จัดส่งสำเนาหลักฐานฉบับสมบูรณ์เพื่อตรวจสอบเปรียบเทียบอีกครั้ง',
      },
    ],
  },
  {
    id: 'case-th-proverbs-craft',
    caseCode: 'คลังสำนวน ก.๐๙/๖๙',
    title: 'ศาสตร์แห่งการพิมพ์สัมผัสและวินัยนักบันทึก',
    subtitle: 'บทความภาษาไทยสละสลวย — ฝึกจังหวะการพิมพ์ยาวต่อเนื่อง',
    language: 'th',
    sourceKind: 'court-case',
    difficulty: 'supreme',
    category: 'วรรณกรรม & ความรู้ (ภาษาไทย)',
    summaryTh:
      'ฝึกจังหวะการพิมพ์ภาษาไทยที่เป็นธรรมชาติ ครอบคลุมสระประสม การันต์ และวรรณยุกต์ครบทุกเสียง',
    lines: [
      {
        id: 'th-pc-1',
        speaker: 'judge',
        speakerName: 'อาจารย์ผู้ฝึกสอน',
        text: 'การพิมพ์สัมผัสที่ยอดเยี่ยมมิได้วัดกันที่ความเร็วเพียงชั่วครู่ หากวัดกันที่ความแม่นยำและจังหวะที่มั่นคงสม่ำเสมอ',
      },
      {
        id: 'th-pc-2',
        speaker: 'defense',
        speakerName: 'หัวหน้าเสมียนศาล',
        text: 'เมื่อวางนิ้วทั้งสิบไว้บนแป้นเหย้าอย่างถูกวิธี สมองจะจดจำตำแหน่งของแต่ละอักษรจนสายตาไม่ต้องก้มมองแป้นพิมพ์อีกต่อไป',
      },
      {
        id: 'th-pc-3',
        speaker: 'witness',
        speakerName: 'นักจดบันทึกอาวุโส',
        text: 'ความอดทนในการฝึกฝนวันละสิบห้านาที จะเปลี่ยนทุกถ้อยคำที่ซับซ้อนให้ไหลลื่นราวกับสายน้ำที่เคลื่อนผ่านปลายนิ้วมือ',
      },
    ],
  },

  // ================= REAL-WORLD UNPREDICTABLE STAGES (MEETINGS, NEWS, PODCASTS, EVERYDAY) =================
  {
    id: 'case-th-will-mystery',
    caseCode: 'คดีหมายเลขดำ ม.๕๐๑/๖๙',
    title: 'คดีพินัยกรรมคฤหาสน์ริมน้ำและพยานลึกลับ',
    subtitle: 'ฝึกพิมพ์ชื่อบุคคล สถานที่ และข้อเท็จจริงที่คาดเดาไม่ได้ในห้องพิจารณาคดี',
    language: 'th',
    sourceKind: 'court-case',
    difficulty: 'senior',
    category: 'คดีศาลจำลอง (ภาษาไทย)',
    lines: [
      {
        id: 'th-wm-1',
        speaker: 'judge',
        speakerName: 'ท่านผู้พิพากษา',
        text: 'ขอเชิญพยานคุณเดวิด และคุณวินเซนต์ ยืนยันความถูกต้องของพินัยกรรมฉบับลงวันที่สิบสองตุลาคมต่อหน้าบัลลังก์',
      },
      {
        id: 'th-wm-2',
        speaker: 'witness',
        speakerName: 'คุณเดวิด (ผู้จัดการมรดก)',
        text: 'ในคืนฝนตกหนักที่คฤหาสน์ริมแม่น้ำเจ้าพระยา ทนายอาวุโสได้หยิบซองเอกสารสีน้ำตาลออกมาประทับตราครั่งต่อหน้าพยานสามคนครับ',
      },
      {
        id: 'th-wm-3',
        speaker: 'prosecutor',
        speakerName: 'ทนายฝ่ายคัดค้าน',
        text: 'แต่ผู้เชี่ยวชาญด้านลายมือตรวจพบว่าหมึกปากกาหมึกซึมบนหน้าสุดท้าย ถูกผลิตขึ้นหลังจากวันที่ระบุในเอกสารถึงสองปีเต็ม',
      },
      {
        id: 'th-wm-4',
        speaker: 'defense',
        speakerName: 'ทนายฝ่ายจำเลย',
        text: 'ขอให้ศาลพิจารณาบันทึกกล้องหน้ารถบริเวณสะพานพุทธและใบเสร็จโรงแรมเชียงใหม่ ซึ่งพิสูจน์ว่าคุณวินเซนต์ไม่ได้อยู่ในกรุงเทพฯ คืนนั้น',
      },
    ],
  },
  {
    id: 'real-th-meeting',
    caseCode: 'MINUTES Q4-TH',
    title: 'บันทึกการประชุมวางแผนผลิตภัณฑ์และงบประมาณ',
    subtitle: 'ฝึกจดบันทึกการประชุมจริง — คำศัพท์ธุรกิจ การตลาด และเทคโนโลยีที่หลากหลาย',
    language: 'th',
    sourceKind: 'court-case',
    difficulty: 'senior',
    category: 'ชีวิตจริง & การประชุม (ไทย)',
    lines: [
      {
        id: 'th-mt-1',
        speaker: 'defense',
        speakerName: 'หัวหน้าทีมผลิตภัณฑ์',
        text: 'สรุปวาระการประชุมช่วงเช้า ทีมพัฒนาจะปล่อยเวอร์ชันทดสอบภายในวันศุกร์นี้ เพื่อให้ฝ่ายการตลาดเตรียมแคมเปญเปิดตัวได้ทันสิ้นเดือน',
      },
      {
        id: 'th-mt-2',
        speaker: 'prosecutor',
        speakerName: 'ผู้จัดการฝ่ายการเงิน',
        text: 'สำหรับงบประมาณโฆษณาไตรมาสสี่ เราควรจัดสรรสัดส่วนหลักไปยังวิดีโอสั้นและกิจกรรมไลฟ์สด พร้อมตั้งเกณฑ์วัดผลต้นทุนต่อลูกค้าใหม่ให้ชัดเจน',
      },
      {
        id: 'th-mt-3',
        speaker: 'witness',
        speakerName: 'วิศวกรระบบคลาวด์',
        text: 'ฝั่งโครงสร้างเซิร์ฟเวอร์ผ่านการทดสอบรองรับผู้ใช้งานพร้อมกันห้าหมื่นคนเรียบร้อยแล้ว เหลือเพียงปรับแต่งระบบสำรองข้อมูลอัตโนมัติทุกชั่วโมงครับ',
      },
      {
        id: 'th-mt-4',
        speaker: 'judge',
        speakerName: 'ประธานที่ประชุม',
        text: 'ขอบคุณทุกฝ่ายมากครับ ขอให้เลขาธิการส่งรายงานสรุปภารกิจและกำหนดส่งงานของแต่ละแผนกเข้ากลุ่มแชตภายในห้าโมงเย็นวันนี้',
      },
    ],
  },
  {
    id: 'real-th-news',
    caseCode: 'NEWS DESK-TH',
    title: 'รายงานข่าวด่วนเทคโนโลยี เศรษฐกิจ และภูมิอากาศ',
    subtitle: 'ฝึกพิมพ์ตามผู้ประกาศข่าว — ชื่อเมือง ตัวเลข หน่วยงาน และคำศัพท์ข่าวสารไม่ซ้ำแบบ',
    language: 'th',
    sourceKind: 'court-case',
    difficulty: 'supreme',
    category: 'ข่าว & พอดแคสต์ (ไทย)',
    lines: [
      {
        id: 'th-nw-1',
        speaker: 'prosecutor',
        speakerName: 'ผู้ประกาศข่าวภาคค่ำ',
        text: 'ข่าวด่วนวันนี้ นักวิจัยพลังงานสะอาดจากโตเกียวและซูริกประกาศความสำเร็จในการพัฒนาแบตเตอรี่โซลิดสเตตที่ชาร์จเต็มได้ภายในแปดนาที',
      },
      {
        id: 'th-nw-2',
        speaker: 'witness',
        speakerName: 'ผู้สื่อข่าวภาคสนาม',
        text: 'ขณะที่ท่าเรือแหลมฉบังและสนามบินสุวรรณภูมิรายงานยอดขนส่งสินค้าเกษตรแปรรูปเติบโตต่อเนื่อง โดยเฉพาะทุเรียนแช่แข็งและกาแฟคั่วจากภาคเหนือ',
      },
      {
        id: 'th-nw-3',
        speaker: 'defense',
        speakerName: 'นักวิเคราะห์เศรษฐกิจ',
        text: 'กรมอุตุนิยมวิทยาเตือนประชาชนบริเวณชายฝั่งอันดามันและอ่าวไทยตอนบน ระมัดระวังพายุฝนฟ้าคะนองและคลื่นลมแรงตลอดสุดสัปดาห์นี้ครับ',
      },
    ],
  },
  {
    id: 'real-th-podcast',
    caseCode: 'PODCAST-TH',
    title: 'พอดแคสต์เล่าเรื่องลึกลับ: นักประดิษฐ์และคดีประวัติศาสตร์',
    subtitle: 'ฝึกพิมพ์คำทับศัพท์ชื่อบุคคลและสถานที่ต่างประเทศเป็นภาษาไทยอย่างคล่องแคล่ว',
    language: 'th',
    sourceKind: 'court-case',
    difficulty: 'senior',
    category: 'ข่าว & พอดแคสต์ (ไทย)',
    lines: [
      {
        id: 'th-pd-1',
        speaker: 'witness',
        speakerName: 'ผู้จัดรายการพอดแคสต์',
        text: 'ยินดีต้อนรับสู่รายการค่ำคืนแห่งประวัติศาสตร์ วันนี้เราจะย้อนเวลาไปเมืองเวนิสและฟลอเรนซ์ เพื่อแกะรอยสมุดบันทึกกลับหัวของลีโอนาร์โด ดาวินชี',
      },
      {
        id: 'th-pd-2',
        speaker: 'defense',
        speakerName: 'แขกรับเชิญนักประวัติศาสตร์',
        text: 'หลายคนอาจไม่ทราบว่าก่อนโยฮันเนส กูเทนเบิร์ก จะประดิษฐ์แท่นพิมพ์โลหะ หนังสือหนึ่งเล่มในยุโรปมีราคาแพงเทียบเท่าบ้านหลังใหญ่หนึ่งหลังเลยทีเดียว',
      },
      {
        id: 'th-pd-3',
        speaker: 'witness',
        speakerName: 'ผู้จัดรายการพอดแคสต์',
        text: 'และที่น่าทึ่งยิ่งกว่านั้นคือในห้องสมุดเก่าแก่แห่งกรุงเวียนนา มีแผนที่เดินเรือโบราณที่วาดเส้นทางข้ามมหาสมุทรแอตแลนติกไว้อย่างแม่นยำเกินยุคสมัย',
      },
    ],
  },
  {
    id: 'real-th-everyday',
    caseCode: 'DAILY-TH 01',
    title: 'บทสนทนาชีวิตประจำวัน: การเดินทาง อาหาร และแผนวันหยุด',
    subtitle: 'คำพูดธรรมชาติที่เจอในชีวิตจริง — พิมพ์ตามเสียงสนทนาได้ลื่นเหมือนคุยแชต',
    language: 'th',
    sourceKind: 'court-case',
    difficulty: 'novice',
    category: 'ชีวิตจริง & การประชุม (ไทย)',
    lines: [
      {
        id: 'th-ev-1',
        speaker: 'witness',
        speakerName: 'เพื่อนร่วมทริป',
        text: 'พรุ่งนี้เช้าเรานัดเจอกันที่สถานีรถไฟฟ้าอโศกเจ็ดโมงครึ่งนะ แวะซื้อกาแฟอเมริกาโน่เย็นกับขนมปังสังขยาก่อนขึ้นรถตู้ไปหัวหินกัน',
      },
      {
        id: 'th-ev-2',
        speaker: 'defense',
        speakerName: 'คนวางแผนเที่ยว',
        text: 'ผมจองโต๊ะร้านอาหารทะเลริมหาดไว้ตอนเที่ยงแล้ว สั่งปลากะพงทอดน้ำปลา ต้มยำกุ้งน้ำข้น แล้วก็หมึกผัดไข่เค็มไว้ล่วงหน้าจะได้ไม่ต้องรอนาน',
      },
      {
        id: 'th-ev-3',
        speaker: 'judge',
        speakerName: 'หัวหน้าแก๊ง',
        text: 'อย่าลืมพกพาวเวอร์แบงก์ เสื้อกันแดด กับร่มพับไปด้วยล่ะ พยากรณ์อากาศบอกว่าช่วงบ่ายอาจมีเมฆครึ้มและฝนโปรยปรายเล็กน้อย',
      },
    ],
  },
  {
    id: 'yt-preset-th-focus',
    caseCode: 'EXHIBIT YT-TH',
    title: 'YouTube Showcase (ไทย): ศิลปะการฝึกสมาธิและสร้างนิสัยเก่งไว',
    subtitle: 'ตัวอย่างคำบรรยายคลิปภาษาไทยพร้อมเสียงพากย์ตามวรรคตอน (วางลิงก์ YouTube ใดก็ได้มาใช้แบบเดียวกัน)',
    language: 'th',
    sourceKind: 'youtube',
    difficulty: 'novice',
    category: 'YouTube ซิงก์คำบรรยาย',
    youtubeId: '5MgBikgcWnY',
    sourceUrl: 'https://www.youtube.com/watch?v=5MgBikgcWnY',
    lines: [
      {
        id: 'yt-th-1',
        speaker: 'witness',
        speakerName: 'ผู้บรรยายคลิป (0:00)',
        startSec: 10,
        endSec: 22,
        text: 'ความลับของการเรียนรู้ทักษะใหม่ให้เก่งขึ้นอย่างรวดเร็ว ไม่ได้อยู่ที่การรอแรงบันดาลใจ แต่อยู่ที่การลงมือฝึกยี่สิบชั่วโมงแรกอย่างมีระบบ',
      },
      {
        id: 'yt-th-2',
        speaker: 'witness',
        speakerName: 'ผู้บรรยายคลิป (0:24)',
        startSec: 24,
        endSec: 36,
        text: 'ขั้นแรกให้แยกทักษะใหญ่ที่ดูน่ากลัวออกเป็นชิ้นเล็กๆ เลือกฝึกส่วนที่สำคัญที่สุดก่อน และตัดสิ่งรบกวนอย่างการแจ้งเตือนมือถือออกไปให้หมด',
      },
      {
        id: 'yt-th-3',
        speaker: 'witness',
        speakerName: 'ผู้บรรยายคลิป (0:38)',
        startSec: 38,
        endSec: 52,
        text: 'เมื่อคุณก้าวข้ามความรู้สึกเก้ๆ กังๆ ในช่วงห้าชั่วโมงแรกไปได้ สมองจะเริ่มเชื่อมโยงจังหวะและทำให้ทุกอย่างสนุกขึ้นอย่างไม่น่าเชื่อครับ',
      },
    ],
  },
  {
    id: 'real-en-workplace',
    caseCode: 'MEETING EN-01',
    title: 'Real-World Call: Product Launch & Client Briefing',
    subtitle: 'บทสนทนาประชุมงานภาษาอังกฤษจริง + คำแปลไทย & ศัพท์ออฟฟิศที่ใช้บ่อย',
    language: 'en',
    sourceKind: 'court-case',
    difficulty: 'senior',
    category: 'ชีวิตจริง & การประชุม (English)',
    lines: [
      {
        id: 'en-wp-1',
        speaker: 'defense',
        speakerName: 'Product Lead',
        text: 'Thanks everyone for joining on short notice. Today we need to review the launch checklist and confirm our timeline with the Tokyo partner.',
        translationTh:
          'ขอบคุณทุกคนที่เข้าประชุมด่วนนะครับ วันนี้เราต้องตรวจเช็กรายการก่อนเปิดตัวและยืนยันกำหนดการกับพาร์ตเนอร์ที่โตเกียว',
        vocab: [
          { word: 'checklist', ipa: '/ˈtʃek.lɪst/', pos: 'n.', th: 'รายการตรวจสอบ' },
          { word: 'confirm', ipa: '/kənˈfɜːrm/', pos: 'v.', th: 'ยืนยัน' },
        ],
      },
      {
        id: 'en-wp-2',
        speaker: 'prosecutor',
        speakerName: 'Operations Director',
        text: 'Our logistics team flagged a slight delay in customs clearance, so we should prepare a contingency plan before Friday afternoon.',
        translationTh:
          'ทีมขนส่งแจ้งเตือนว่าพิธีการศุลกากรอาจล่าช้าเล็กน้อย เราจึงควรเตรียมแผนสำรองไว้ก่อนบ่ายวันศุกร์ครับ',
        vocab: [
          { word: 'logistics', ipa: '/ləˈdʒɪs.tɪks/', pos: 'n.', th: 'ระบบขนส่งและโลจิสติกส์' },
          { word: 'contingency', ipa: '/kənˈtɪn.dʒən.si/', pos: 'n.', th: 'แผนสำรองรับมือเหตุฉุกเฉิน' },
        ],
      },
      {
        id: 'en-wp-3',
        speaker: 'witness',
        speakerName: 'Lead Designer',
        text: 'The prototype feedback from beta testers was overwhelmingly positive, especially regarding keyboard shortcuts and voice dictation clarity.',
        translationTh:
          'ผลตอบรับต้นแบบจากผู้ทดสอบรุ่นเบต้าดีเกินคาดมาก โดยเฉพาะเรื่องคีย์ลัดและความชัดเจนของเสียงอ่านตามคำบอกครับ',
        vocab: [
          { word: 'prototype', ipa: '/ˈproʊ.tə.taɪp/', pos: 'n.', th: 'ต้นแบบผลิตภัณฑ์' },
          { word: 'overwhelmingly', ipa: '/ˌoʊ.vərˈwel.mɪŋ.li/', pos: 'adv.', th: 'อย่างท่วมท้น, อย่างล้นหลาม' },
        ],
      },
    ],
  },
  {
    id: 'real-en-podcast',
    caseCode: 'PODCAST EN-02',
    title: 'Podcast: Unpredictable Journeys & Human Curiosity',
    subtitle: 'พอดแคสต์ภาษาอังกฤษเล่าเรื่องจริง ฝึกฟัง-พิมพ์ตามเสียงธรรมชาติ + แปลไทย',
    language: 'en',
    sourceKind: 'court-case',
    difficulty: 'novice',
    category: 'ข่าว & พอดแคสต์ (English)',
    lines: [
      {
        id: 'en-pd-1',
        speaker: 'witness',
        speakerName: 'Podcast Host',
        text: 'Welcome back to Evening Stories. Tonight, David and Vincent share how a missed train in Kyoto led them to an unforgettable midnight ramen shop.',
        translationTh:
          'ยินดีต้อนรับกลับสู่รายการเรื่องเล่ายามค่ำ คืนนี้เดวิดและวินเซนต์จะมาเล่าว่าการตกรถไฟที่เกียวโตพาพวกเขาไปเจอร้านราเม็งเที่ยงคืนที่ไม่มีวันลืมได้อย่างไร',
        vocab: [
          { word: 'unforgettable', ipa: '/ˌʌn.fərˈɡet.ə.bəl/', pos: 'adj.', th: 'ที่มิอาจลืมเลือน' },
        ],
      },
      {
        id: 'en-pd-2',
        speaker: 'defense',
        speakerName: 'Guest Storyteller',
        text: 'Real life rarely follows a neat script. When unexpected detours appear, staying calm and curious turns small accidents into great stories.',
        translationTh:
          'ชีวิตจริงแทบไม่เคยเดินตามบทที่วางไว้เป๊ะๆ เมื่อมีทางอ้อมที่ไม่คาดคิดโผล่มา การตั้งสติและเปิดใจใคร่รู้จะเปลี่ยนเรื่องบังเอิญเล็กๆ ให้กลายเป็นเรื่องเล่าชั้นยอด',
        vocab: [
          { word: 'detours', ipa: '/ˈdiː.tʊərz/', pos: 'n.', th: 'ทางอ้อม, การเปลี่ยนเส้นทางกะทันหัน' },
          { word: 'rarely', ipa: '/ˈreər.li/', pos: 'adv.', th: 'ไม่ค่อยจะ, นานๆ ครั้ง' },
        ],
      },
    ],
  },

  // ================= READY-TO-PLAY YOUTUBE SHOWCASE PRESETS =================
  {
    id: 'yt-preset-court-english',
    caseCode: 'EXHIBIT YT-01',
    title: 'YouTube Showcase: The Power of Habit & Deep Focus',
    subtitle: 'ตัวอย่างโหมด YouTube ซิงก์เวลาคำบรรยายพร้อมคำแปลไทย (หรือวางลิงก์ YouTube อื่นได้ทันที)',
    language: 'en',
    sourceKind: 'youtube',
    difficulty: 'senior',
    category: 'YouTube ซิงก์คำบรรยาย',
    youtubeId: '5MgBikgcWnY',
    sourceUrl: 'https://www.youtube.com/watch?v=5MgBikgcWnY',
    summaryTh:
      'ตัวอย่างการฝึกพิมพ์ตามคำบรรยายคลิป TEDx (The First 20 Hours — How to Learn Anything) พร้อมตัวเล่น YouTube ซิงก์เวลาและคำแปลไทยทุกบรรทัด',
    lines: [
      {
        id: 'yt1-1',
        speaker: 'witness',
        speakerName: 'TEDx Speaker (0:00)',
        startSec: 12,
        endSec: 22,
        text: 'Two years ago, my life changed forever when my wife and I welcomed our daughter into the world.',
        translationTh:
          'สองปีก่อน ชีวิตผมเปลี่ยนไปตลอดกาลเมื่อภรรยาและผมได้ต้อนรับลูกสาวตัวน้อยลืมตาดูโลก',
        vocab: [
          { word: 'welcomed', ipa: '/ˈwel.kəmd/', pos: 'v.', th: 'ต้อนรับ' },
          { word: 'forever', ipa: '/fərˈev.ər/', pos: 'adv.', th: 'ตลอดกาล' },
        ],
      },
      {
        id: 'yt1-2',
        speaker: 'witness',
        speakerName: 'TEDx Speaker (0:25)',
        startSec: 25,
        endSec: 36,
        text: 'Research shows that going from knowing nothing to being reasonably good takes just twenty hours of focused practice.',
        translationTh:
          'งานวิจัยชี้ว่าการพัฒนาจากไม่รู้อะไรเลยจนเก่งในระดับใช้งานได้จริง ใช้เวลาฝึกอย่างจดจ่อเพียงยี่สิบชั่วโมงเท่านั้น',
        vocab: [
          { word: 'reasonably', ipa: '/ˈriː.zən.ə.bli/', pos: 'adv.', th: 'ในระดับที่สมเหตุสมผล/พอใช้ได้' },
          { word: 'focused', ipa: '/ˈfoʊ.kəst/', pos: 'adj.', th: 'จดจ่อมีสมาธิ' },
        ],
      },
      {
        id: 'yt1-3',
        speaker: 'witness',
        speakerName: 'TEDx Speaker (0:40)',
        startSec: 40,
        endSec: 52,
        text: 'Deconstruct the skill into smaller parts, remove distractions, and practice deliberately every single day.',
        translationTh:
          'แตกทักษะใหญ่ออกเป็นส่วนย่อย ขจัดสิ่งรบกวนออกให้หมด และฝึกฝนอย่างตั้งใจในทุกๆ วัน',
        vocab: [
          { word: 'deconstruct', ipa: '/ˌdiː.kənˈstrʌkt/', pos: 'v.', th: 'แยกส่วนวิเคราะห์' },
          { word: 'distractions', ipa: '/dɪˈstræk.ʃənz/', pos: 'n.', th: 'สิ่งรบกวนสมาธิ' },
        ],
      },
      {
        id: 'yt1-4',
        speaker: 'witness',
        speakerName: 'TEDx Speaker (0:55)',
        startSec: 55,
        endSec: 68,
        text: 'The major barrier to learning something new is not intellectual; it is emotional—the fear of feeling foolish.',
        translationTh:
          'อุปสรรคสำคัญที่สุดของการเรียนรู้สิ่งใหม่ไม่ใช่เรื่องสติปัญญา แต่เป็นเรื่องอารมณ์ นั่นคือความกลัวที่จะรู้สึกว่าตัวเองดูไม่เก่ง',
        vocab: [
          { word: 'barrier', ipa: '/ˈbær.i.ər/', pos: 'n.', th: 'อุปสรรค, สิ่งกีดขวาง' },
          { word: 'intellectual', ipa: '/ˌɪn.təlˈek.tʃu.əl/', pos: 'adj.', th: 'ทางสติปัญญา' },
        ],
      },
    ],
  },

  // ================= TOUCH-TYPING FINGER DRILLS (TH & EN) =================
  {
    id: 'drill-th-homerow',
    caseCode: 'DRILL TH-01',
    title: 'ฝึกนิ้วแป้นเหย้าภาษาไทย (ฟ ห ก ด เ ้ า ส ว)',
    subtitle: 'ปูพื้นฐานการวางนิ้ว 10 นิ้วบนแป้นเกษมณีแบบมืออาชีพ',
    language: 'th',
    sourceKind: 'drill',
    difficulty: 'novice',
    category: 'แบบฝึกหัดวางนิ้ว (ไทย)',
    lines: [
      {
        id: 'dth-1',
        speaker: 'judge',
        speakerName: 'ครูฝึกแป้นเหย้า',
        text: 'ฟหกด ่าสว ฟหกด ่าสว กดหา ดาสว กาหา สาวหา ดาวสาด',
      },
      {
        id: 'dth-2',
        speaker: 'judge',
        speakerName: 'ครูฝึกแป้นเหย้า',
        text: 'หาดทราย สวยงาม เดินหา ดาวฟ้า ห้าสิบ สาดน้ำ เกาหัว ฟาดฟัน',
      },
      {
        id: 'dth-3',
        speaker: 'judge',
        speakerName: 'ครูฝึกแป้นเหย้า',
        text: 'เก่งกล้า ก้าวหน้า เฝ้าดู เสาะหา ห่วงหา วาดภาพ เสาวรส กาเหว่า',
      },
    ],
  },
  {
    id: 'drill-th-tones-shift',
    caseCode: 'DRILL TH-02',
    title: 'ฝึกสระบน-ล่าง วรรณยุกต์ และปุ่ม Shift ไทย',
    subtitle: 'ปราบปุ่มยาก ิ ี ึ ื ุ ู ่ ้ ๊ ๋ ์ และอักษรยกแคร่ ฆ ฏ โ ฌ ษ ศ ซ',
    language: 'th',
    sourceKind: 'drill',
    difficulty: 'senior',
    category: 'แบบฝึกหัดวางนิ้ว (ไทย)',
    lines: [
      {
        id: 'dth-s1',
        speaker: 'prosecutor',
        speakerName: 'ครูฝึกวรรณยุกต์',
        text: 'ก่า ก้า ก๊า ก๋า ปี่ ปี้ ปิ๊ ปิ๋ ชื่นใจ คืนนี้ ดื่มน้ำ พื้นที่ ข้อมูล',
      },
      {
        id: 'dth-s2',
        speaker: 'prosecutor',
        speakerName: 'ครูฝึกอักษร Shift',
        text: 'ศาลฎีกา โฆษณา พิษณุโลก พิธีกรรม โบราณคดี วัฒนธรรม ธรรมชาติ ฤดูกาล',
      },
      {
        id: 'dth-s3',
        speaker: 'prosecutor',
        speakerName: 'ครูฝึกอักษร Shift',
        text: 'กฎเกณฑ์ สัญญาณ ผลิตภัณฑ์ ปรัชญา เศรษฐกิจ พฤติกรรม พิสูจน์หลักฐาน',
      },
    ],
  },
  {
    id: 'drill-en-homerow',
    caseCode: 'DRILL EN-01',
    title: 'English Home Row & Legal Speed Foundation',
    subtitle: 'ฝึกแป้นเหย้าภาษาอังกฤษ A S D F J K L ; พร้อมคำแปลไทย',
    language: 'en',
    sourceKind: 'drill',
    difficulty: 'novice',
    category: 'แบบฝึกหัดวางนิ้ว (English)',
    lines: [
      {
        id: 'den-1',
        speaker: 'judge',
        speakerName: 'Typing Instructor',
        text: 'ask dad; fall lad; a flask; a glad salad; half a glass;',
        translationTh: 'ชุดคำฝึกแป้นเหย้า: ถามพ่อ; ตกลง; ขวดแบน; สลัดที่สดชื่น; น้ำครึ่งแก้ว',
      },
      {
        id: 'den-2',
        speaker: 'judge',
        speakerName: 'Typing Instructor',
        text: 'fair facts shall stand; clear laws safeguard all fair trials.',
        translationTh: 'ข้อเท็จจริงที่ยุติธรรมย่อมยืนหยัด กฎหมายที่ชัดเจนคุ้มครองการพิจารณาคดีที่เป็นธรรมทุกคดี',
        vocab: [
          { word: 'safeguard', ipa: '/ˈseɪf.ɡɑːrd/', pos: 'v.', th: 'คุ้มครอง, ปกป้อง' },
        ],
      },
      {
        id: 'den-3',
        speaker: 'judge',
        speakerName: 'Typing Instructor',
        text: 'Keep your wrists relaxed, eyes on the transcript, and let every finger return to home row.',
        translationTh: 'ผ่อนคลายข้อมือ สายตาจับจ้องที่เอกสารสำนวน และให้ทุกนิ้วกลับมาวางบนแป้นเหย้าเสมอ',
        vocab: [
          { word: 'wrists', ipa: '/rɪsts/', pos: 'n.', th: 'ข้อมือ' },
          { word: 'relaxed', ipa: '/rɪˈlækst/', pos: 'adj.', th: 'ผ่อนคลาย' },
        ],
      },
    ],
  },
];

/**
 * Rich Offline Random Pool (Thai & English) so the Random button works
 * instantaneously even without internet, alongside live Wikipedia Random!
 */
export const OFFLINE_RANDOM_GEMS: CaseDossier[] = [
  {
    id: 'gem-en-library-alexandria',
    caseCode: 'ARCHIVE GEM-01',
    title: 'The Great Library of Alexandria',
    subtitle: 'คลังความรู้ประวัติศาสตร์โลก (สุ่มออฟไลน์ + คำแปลไทย)',
    language: 'en',
    sourceKind: 'random',
    difficulty: 'senior',
    category: 'คลังความรู้สุ่ม (English)',
    lines: [
      {
        id: 'g1-1',
        speaker: 'witness',
        speakerName: 'Historian',
        text: 'For centuries, the Library of Alexandria stood as the greatest archive of human knowledge in the ancient world.',
        translationTh:
          'เป็นเวลาหลายศตวรรษที่หอสมุดอเล็กซานเดรียยืนหยัดเป็นคลังความรู้ของมนุษยชาติที่ยิ่งใหญ่ที่สุดในโลกยุคโบราณ',
        vocab: [
          { word: 'archive', ipa: '/ˈɑːr.kaɪv/', pos: 'n.', th: 'คลังเอกสาร, หอจดหมายเหตุ' },
          { word: 'ancient', ipa: '/ˈeɪn.ʃənt/', pos: 'adj.', th: 'โบราณ' },
        ],
      },
      {
        id: 'g1-2',
        speaker: 'witness',
        speakerName: 'Historian',
        text: 'Ships docking at the harbor were required to lend their scrolls so royal scribes could copy every single page.',
        translationTh:
          'เรือทุกลำที่เทียบท่าจะต้องให้ยืมม้วนหนังสือ เพื่อให้อาลักษณ์หลวงคัดลอกเก็บไว้ทุกหน้าอย่างครบถ้วน',
        vocab: [
          { word: 'harbor', ipa: '/ˈhɑːr.bər/', pos: 'n.', th: 'ท่าเรือ' },
          { word: 'scrolls', ipa: '/skroʊlz/', pos: 'n.', th: 'ม้วนกระดาษ/คัมภีร์โบราณ' },
        ],
      },
      {
        id: 'g1-3',
        speaker: 'witness',
        speakerName: 'Historian',
        text: 'Though the scrolls eventually vanished, its spirit survives wherever curious minds preserve stories for future generations.',
        translationTh:
          'แม้ม้วนคัมภีร์เหล่านั้นจะสูญสลายไปตามกาลเวลา แต่จิตวิญญาณของมันยังคงอยู่ทุกแห่งหนที่มีผู้ใฝ่รู้คอยรักษาเรื่องราวไว้ให้คนรุ่นหลัง',
        vocab: [
          { word: 'vanished', ipa: '/ˈvæn.ɪʃt/', pos: 'v.', th: 'อันตรธานหายไป' },
          { word: 'preserve', ipa: '/prɪˈzɜːrv/', pos: 'v.', th: 'อนุรักษ์, เก็บรักษา' },
        ],
      },
    ],
  },
  {
    id: 'gem-en-voyager-golden-record',
    caseCode: 'ARCHIVE GEM-02',
    title: 'The Voyager Golden Record',
    subtitle: 'แผ่นเสียงทองคำสู่ห้วงอวกาศ (สุ่มออฟไลน์ + คำแปลไทย)',
    language: 'en',
    sourceKind: 'random',
    difficulty: 'senior',
    category: 'คลังความรู้สุ่ม (English)',
    lines: [
      {
        id: 'g2-1',
        speaker: 'witness',
        speakerName: 'Astronomer',
        text: 'In 1977, humanity launched two spacecraft carrying golden records filled with music, greetings, and images of Earth.',
        translationTh:
          'ในปี ค.ศ. 1977 มนุษยชาติได้ส่งยานอวกาศสองลำที่บรรทุกแผ่นเสียงทองคำ ซึ่งอัดแน่นด้วยดนตรี คำทักทาย และภาพถ่ายของโลก',
        vocab: [
          { word: 'launched', ipa: '/lɔːntʃt/', pos: 'v.', th: 'ปล่อยตัว, ส่งขึ้นสู่อวกาศ' },
          { word: 'greetings', ipa: '/ˈɡriː.tɪŋz/', pos: 'n.', th: 'คำทักทาย' },
        ],
      },
      {
        id: 'g2-2',
        speaker: 'witness',
        speakerName: 'Astronomer',
        text: 'Among fifty-five spoken languages, a gentle Thai greeting was etched into gold to drift across interstellar space.',
        translationTh:
          'ในบรรดาห้าสิบห้าภาษาพูด มีคำทักทายภาษาไทยอันอ่อนโยนถูกสลักลงบนแผ่นทองคำเพื่อล่องลอยข้ามห้วงอวกาศระหว่างดวงดาว',
        vocab: [
          { word: 'etched', ipa: '/etʃt/', pos: 'v.', th: 'ถูกแกะสลักไว้' },
          { word: 'interstellar', ipa: '/ˌɪn.tərˈstel.ər/', pos: 'adj.', th: 'ระหว่างดวงดาว' },
        ],
      },
    ],
  },
  {
    id: 'gem-en-everyday-negotiation',
    caseCode: 'ARCHIVE GEM-03',
    title: 'Clear Communication in High-Stakes Meetings',
    subtitle: 'ภาษาอังกฤษเพื่อการสื่อสารในที่ทำงาน (สุ่มออฟไลน์ + คำแปลไทย)',
    language: 'en',
    sourceKind: 'random',
    difficulty: 'novice',
    category: 'คลังความรู้สุ่ม (English)',
    lines: [
      {
        id: 'g3-1',
        speaker: 'defense',
        speakerName: 'Senior Advisor',
        text: 'Before we finalize the proposal, let us verify every figure and align on the key milestones together.',
        translationTh:
          'ก่อนที่เราจะสรุปข้อเสนอฉบับสุดท้าย เรามาตรวจสอบตัวเลขทุกตัวและปรับความเข้าใจเรื่องเป้าหมายสำคัญร่วมกันก่อนนะครับ',
        vocab: [
          { word: 'finalize', ipa: '/ˈfaɪ.nə.laɪz/', pos: 'v.', th: 'ทำให้เสร็จสมบูรณ์ขั้นสุดท้าย' },
          { word: 'milestones', ipa: '/ˈmaɪl.stoʊnz/', pos: 'n.', th: 'หมุดหมายสำคัญของโครงการ' },
        ],
      },
      {
        id: 'g3-2',
        speaker: 'defense',
        speakerName: 'Senior Advisor',
        text: 'Speaking with calm clarity builds immediate trust, especially when unexpected challenges arise under pressure.',
        translationTh:
          'การสื่อสารด้วยความสงบและชัดเจนช่วยสร้างความไว้วางใจได้ทันที โดยเฉพาะเมื่อเกิดความท้าทายที่ไม่คาดคิดภายใต้ความกดดัน',
        vocab: [
          { word: 'clarity', ipa: '/ˈklær.ə.ti/', pos: 'n.', th: 'ความชัดเจนกระจ่างใส' },
          { word: 'unexpected', ipa: '/ˌʌn.ɪkˈspek.tɪd/', pos: 'adj.', th: 'ที่ไม่คาดคิดมาก่อน' },
        ],
      },
    ],
  },
  {
    id: 'gem-th-history-printing',
    caseCode: 'คลังสุ่ม TH-01',
    title: 'กำเนิดเครื่องพิมพ์ดีดภาษาไทยและแป้นเกษมณี',
    subtitle: 'เกร็ดประวัติศาสตร์การพิมพ์สัมผัสของไทย',
    language: 'th',
    sourceKind: 'random',
    difficulty: 'novice',
    category: 'คลังความรู้สุ่ม (ภาษาไทย)',
    lines: [
      {
        id: 'gth1-1',
        speaker: 'witness',
        speakerName: 'นักประวัติศาสตร์',
        text: 'เครื่องพิมพ์ดีดภาษาไทยเครื่องแรกถือกำเนิดขึ้นในสมัยรัชกาลที่ห้า โดยมีจุดมุ่งหมายเพื่อช่วยให้การบันทึกเอกสารราชการรวดเร็วยิ่งขึ้น',
      },
      {
        id: 'gth1-2',
        speaker: 'witness',
        speakerName: 'นักประวัติศาสตร์',
        text: 'ต่อมาคุณสุวรรณประเสริฐ เกษมณี ได้ออกแบบผังแป้นพิมพ์เกษมณี โดยจัดวางตัวอักษรที่ใช้บ่อยไว้บริเวณกึ่งกลางเพื่อลดความเมื่อยล้าของนิ้วมือ',
      },
      {
        id: 'gth1-3',
        speaker: 'witness',
        speakerName: 'นักประวัติศาสตร์',
        text: 'จนถึงยุคคอมพิวเตอร์ในปัจจุบัน แป้นพิมพ์เกษมณีก็ยังคงเป็นมาตรฐานหลักที่คนไทยทั่วประเทศใช้สื่อสารและสร้างสรรค์ผลงานทุกวัน',
      },
    ],
  },
  {
    id: 'gem-th-astronomy',
    caseCode: 'คลังสุ่ม TH-02',
    title: 'แสงดาวจากอดีตและการเดินทางของเวลา',
    subtitle: 'เกร็ดวิทยาศาสตร์ชวนคิด ฝึกพิมพ์คำยาวภาษาไทย',
    language: 'th',
    sourceKind: 'random',
    difficulty: 'senior',
    category: 'คลังความรู้สุ่ม (ภาษาไทย)',
    lines: [
      {
        id: 'gth2-1',
        speaker: 'witness',
        speakerName: 'นักดาราศาสตร์',
        text: 'ทุกครั้งที่เราเงยหน้ามองท้องฟ้ายามค่ำคืน แสงจากดวงดาวที่เดินทางมาถึงดวงตาของเรานั้นแท้จริงแล้วคือภาพจากอดีตอันแสนไกล',
      },
      {
        id: 'gth2-2',
        speaker: 'witness',
        speakerName: 'นักดาราศาสตร์',
        text: 'แม้แต่แสงจากดวงอาทิตย์ที่ส่องสว่างในยามเช้า ก็ต้องใช้เวลาเดินทางผ่านอวกาศกว่าแปดนาทีจึงจะสัมผัสพื้นผิวโลกของเรา',
      },
    ],
  },
];
