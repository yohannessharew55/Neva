export interface BibleVerse {
  id: string;
  refEn: string;
  refAm: string;
  textEn: string;
  textAm: string;
  theme: string;
  themeAm: string;
  category: 'faith' | 'peace' | 'strength' | 'wisdom' | 'love' | 'hope' | 'praise' | 'salvation';
}

export interface BibleBook {
  nameEn: string;
  nameAm: string;
  testament: 'OT' | 'NT';
  chapters: number;
  categoryEn: string;
  categoryAm: string;
}

export interface BibleStudyArea {
  id: string;
  nameEn: string;
  nameAm: string;
  icon: string;
  descriptionEn: string;
  descriptionAm: string;
  color: string;
}

export interface BibleReadingSession {
  id: string;
  date: string;
  book: string;
  chapterStart: number;
  chapterEnd: number;
  durationMinutes: number;
  notes?: string;
  completedAt: string;
}

export interface BibleStudySession {
  id: string;
  date: string;
  areaId: string;
  areaName: string;
  topic: string;
  passage: string;
  durationMinutes: number;
  keyInsights: string;
  application?: string;
  completedAt: string;
}

export const BIBLE_STUDY_AREAS: BibleStudyArea[] = [
  {
    id: 'theology',
    nameEn: 'Theology & Doctrine',
    nameAm: 'ነገረ መለኮትና መሰረተ እምነት',
    icon: '🏛️',
    descriptionEn: 'The nature of God, the Trinity, salvation, justification, and eternal truths.',
    descriptionAm: 'የእግዚአብሔር ባሕርይ፣ ስላሴ፣ ደኅንነትና የዘላለም እውነት ጥናት።',
    color: '#a855f7'
  },
  {
    id: 'gospels',
    nameEn: 'The Gospels & Life of Christ',
    nameAm: 'ወንጌላትና የክርስቶስ ህይወት',
    icon: '✝️',
    descriptionEn: 'The teachings, parables, miracles, death, and resurrection of Jesus Christ.',
    descriptionAm: 'የኢየሱስ ክርስቶስ ትምህርቶች፣ ምሳሌዎች፣ ተአምራትና ትንሳኤ።',
    color: '#ef4444'
  },
  {
    id: 'epistles',
    nameEn: 'Epistles & Practical Walk',
    nameAm: 'መልእክታትና ተግባራዊ ክርስቲያናዊ ኑሮ',
    icon: '📜',
    descriptionEn: 'Apostolic letters on sanctification, church life, faith in action, and daily conduct.',
    descriptionAm: 'የሐዋርያት መልእክታት፣ በዕለት ተዕለት ኑሮ እምነትን መኖር።',
    color: '#0082ff'
  },
  {
    id: 'wisdom',
    nameEn: 'Wisdom, Psalms & Poetry',
    nameAm: 'የጥበብ መጻሕፍትና መዝሙራት',
    icon: '🌿',
    descriptionEn: 'Psalms, Proverbs, Ecclesiastes, and Job: Worship, discernment, and godly counsel.',
    descriptionAm: 'መዝሙራት፣ ምሳሌ፣ ጥበብና ፈሪሃ እግዚአብሔር።',
    color: '#10b981'
  },
  {
    id: 'ot_history',
    nameEn: 'Old Testament & Covenants',
    nameAm: 'የብሉይ ኪዳን ታሪክና ቃልኪዳናት',
    icon: '🏺',
    descriptionEn: 'Creation, the Patriarchs, Exodus, the Law, Davidic Kingdom, and prophetic shadows.',
    descriptionAm: 'ፍጥረት፣ አባቶች፣ ዘጸአት፣ ህግና የእግዚአብሔር ቃልኪዳኖች።',
    color: '#f59e0b'
  },
  {
    id: 'prophecy',
    nameEn: 'Prophecy & Eschatology',
    nameAm: 'ትንቢትና የፍጻሜ ዘመን',
    icon: '🕊️',
    descriptionEn: 'Messianic prophecies, prophetic visions, Daniel, and the Book of Revelation.',
    descriptionAm: 'ስለ መሲሑ የተነገሩ ትንቢቶችና የፍጻሜ ዘመን ራዕይ።',
    color: '#ec4899'
  },
  {
    id: 'inductive',
    nameEn: 'Inductive Chapter Deep-Dive',
    nameAm: 'ጥልቅ የምዕራፍ ምርምር',
    icon: '🔍',
    descriptionEn: 'Observation, interpretation, and life application of whole chapters in context.',
    descriptionAm: 'ምዕራፉን በጥልቀት መመርመር፣ መረዳትና ለህይወት መተርጎም።',
    color: '#06b6d4'
  },
  {
    id: 'character',
    nameEn: 'Biblical Character Study',
    nameAm: 'የመጽሐፍ ቅዱስ ሰብእና ጥናት',
    icon: '👤',
    descriptionEn: 'Learning from the faith, failures, courage, and victories of biblical figures.',
    descriptionAm: 'የመጽሐፍ ቅዱስ ሰዎችን እምነት፣ ፈተናና ድል መመርመር።',
    color: '#8b5cf6'
  }
];

export const BIBLE_BOOKS: BibleBook[] = [
  // Old Testament
  { nameEn: 'Genesis', nameAm: 'ኦሪት ዘፍጥረት', testament: 'OT', chapters: 50, categoryEn: 'Pentateuch', categoryAm: 'ኦሪት' },
  { nameEn: 'Exodus', nameAm: 'ኦሪት ዘጸአት', testament: 'OT', chapters: 40, categoryEn: 'Pentateuch', categoryAm: 'ኦሪት' },
  { nameEn: 'Leviticus', nameAm: 'ኦሪት ዘሌዋውያን', testament: 'OT', chapters: 27, categoryEn: 'Pentateuch', categoryAm: 'ኦሪት' },
  { nameEn: 'Numbers', nameAm: 'ኦሪት ዘኍልቍ', testament: 'OT', chapters: 36, categoryEn: 'Pentateuch', categoryAm: 'ኦሪት' },
  { nameEn: 'Deuteronomy', nameAm: 'ኦሪት ዘዳግም', testament: 'OT', chapters: 34, categoryEn: 'Pentateuch', categoryAm: 'ኦሪት' },
  { nameEn: 'Joshua', nameAm: 'መጽሐፈ ኢያሱ', testament: 'OT', chapters: 24, categoryEn: 'Historical', categoryAm: 'ታሪክ' },
  { nameEn: 'Judges', nameAm: 'መጽሐፈ መሳፍንት', testament: 'OT', chapters: 21, categoryEn: 'Historical', categoryAm: 'ታሪክ' },
  { nameEn: 'Ruth', nameAm: 'መጽሐፈ ሩት', testament: 'OT', chapters: 4, categoryEn: 'Historical', categoryAm: 'ታሪክ' },
  { nameEn: '1 Samuel', nameAm: '1 ሳሙኤል', testament: 'OT', chapters: 31, categoryEn: 'Historical', categoryAm: 'ታሪክ' },
  { nameEn: '2 Samuel', nameAm: '2 ሳሙኤል', testament: 'OT', chapters: 24, categoryEn: 'Historical', categoryAm: 'ታሪክ' },
  { nameEn: '1 Kings', nameAm: '1 ነገሥት', testament: 'OT', chapters: 22, categoryEn: 'Historical', categoryAm: 'ታሪክ' },
  { nameEn: '2 Kings', nameAm: '2 ነገሥት', testament: 'OT', chapters: 25, categoryEn: 'Historical', categoryAm: 'ታሪክ' },
  { nameEn: '1 Chronicles', nameAm: '1 ዜና መዋዕል', testament: 'OT', chapters: 29, categoryEn: 'Historical', categoryAm: 'ታሪክ' },
  { nameEn: '2 Chronicles', nameAm: '2 ዜና መዋዕል', testament: 'OT', chapters: 36, categoryEn: 'Historical', categoryAm: 'ታሪክ' },
  { nameEn: 'Ezra', nameAm: 'መጽሐፈ ዕዝራ', testament: 'OT', chapters: 10, categoryEn: 'Historical', categoryAm: 'ታሪክ' },
  { nameEn: 'Nehemiah', nameAm: 'መጽሐፈ ነህምያ', testament: 'OT', chapters: 13, categoryEn: 'Historical', categoryAm: 'ታሪክ' },
  { nameEn: 'Esther', nameAm: 'መጽሐፈ አስቴር', testament: 'OT', chapters: 10, categoryEn: 'Historical', categoryAm: 'ታሪክ' },
  { nameEn: 'Job', nameAm: 'መጽሐፈ ኢዮብ', testament: 'OT', chapters: 42, categoryEn: 'Poetry & Wisdom', categoryAm: 'ጥበብ' },
  { nameEn: 'Psalms', nameAm: 'መዝሙረ ዳዊት', testament: 'OT', chapters: 150, categoryEn: 'Poetry & Wisdom', categoryAm: 'ጥበብ' },
  { nameEn: 'Proverbs', nameAm: 'መጽሐፈ ምሳሌ', testament: 'OT', chapters: 31, categoryEn: 'Poetry & Wisdom', categoryAm: 'ጥበብ' },
  { nameEn: 'Ecclesiastes', nameAm: 'መጽሐፈ መክብብ', testament: 'OT', chapters: 12, categoryEn: 'Poetry & Wisdom', categoryAm: 'ጥበብ' },
  { nameEn: 'Song of Solomon', nameAm: 'መኃልየ መኃልይ ዘሰሎሞን', testament: 'OT', chapters: 8, categoryEn: 'Poetry & Wisdom', categoryAm: 'ጥበብ' },
  { nameEn: 'Isaiah', nameAm: 'ትንቢተ ኢሳይያስ', testament: 'OT', chapters: 66, categoryEn: 'Major Prophets', categoryAm: 'ታላላቅ ነቢያት' },
  { nameEn: 'Jeremiah', nameAm: 'ትንቢተ ኤርምያስ', testament: 'OT', chapters: 52, categoryEn: 'Major Prophets', categoryAm: 'ታላላቅ ነቢያት' },
  { nameEn: 'Lamentations', nameAm: 'ሰቆቃወ ኤርምያስ', testament: 'OT', chapters: 5, categoryEn: 'Major Prophets', categoryAm: 'ታላላቅ ነቢያት' },
  { nameEn: 'Ezekiel', nameAm: 'ትንቢተ ሕዝቅኤል', testament: 'OT', chapters: 48, categoryEn: 'Major Prophets', categoryAm: 'ታላላቅ ነቢያት' },
  { nameEn: 'Daniel', nameAm: 'ትንቢተ ዳንኤል', testament: 'OT', chapters: 12, categoryEn: 'Major Prophets', categoryAm: 'ታላላቅ ነቢያት' },

  // New Testament
  { nameEn: 'Matthew', nameAm: 'የማቴዎስ ወንጌል', testament: 'NT', chapters: 28, categoryEn: 'Gospels', categoryAm: 'ወንጌል' },
  { nameEn: 'Mark', nameAm: 'የማርቆስ ወንጌል', testament: 'NT', chapters: 16, categoryEn: 'Gospels', categoryAm: 'ወንጌል' },
  { nameEn: 'Luke', nameAm: 'የሉቃስ ወንጌል', testament: 'NT', chapters: 24, categoryEn: 'Gospels', categoryAm: 'ወንጌል' },
  { nameEn: 'John', nameAm: 'የዮሐንስ ወንጌል', testament: 'NT', chapters: 21, categoryEn: 'Gospels', categoryAm: 'ወንጌል' },
  { nameEn: 'Acts', nameAm: 'የሐዋርያት ሥራ', testament: 'NT', chapters: 28, categoryEn: 'History', categoryAm: 'ታሪክ' },
  { nameEn: 'Romans', nameAm: 'የሮሜ መልእክት', testament: 'NT', chapters: 16, categoryEn: 'Pauline Epistles', categoryAm: 'የጳውሎስ መልእክታት' },
  { nameEn: '1 Corinthians', nameAm: '1 ቆሮንቶስ', testament: 'NT', chapters: 16, categoryEn: 'Pauline Epistles', categoryAm: 'የጳውሎስ መልእክታት' },
  { nameEn: '2 Corinthians', nameAm: '2 ቆሮንቶስ', testament: 'NT', chapters: 13, categoryEn: 'Pauline Epistles', categoryAm: 'የጳውሎስ መልእክታት' },
  { nameEn: 'Galatians', nameAm: 'ገላትያ', testament: 'NT', chapters: 6, categoryEn: 'Pauline Epistles', categoryAm: 'የጳውሎስ መልእክታት' },
  { nameEn: 'Ephesians', nameAm: 'ኤፌሶን', testament: 'NT', chapters: 6, categoryEn: 'Pauline Epistles', categoryAm: 'የጳውሎስ መልእክታት' },
  { nameEn: 'Philippians', nameAm: 'ፊልጵስዩስ', testament: 'NT', chapters: 4, categoryEn: 'Pauline Epistles', categoryAm: 'የጳውሎስ መልእክታት' },
  { nameEn: 'Colossians', nameAm: 'ቈላስይስ', testament: 'NT', chapters: 4, categoryEn: 'Pauline Epistles', categoryAm: 'የጳውሎስ መልእክታት' },
  { nameEn: '1 Thessalonians', nameAm: '1 ተሰሎንቄ', testament: 'NT', chapters: 5, categoryEn: 'Pauline Epistles', categoryAm: 'የጳውሎስ መልእክታት' },
  { nameEn: '2 Thessalonians', nameAm: '2 ተሰሎንቄ', testament: 'NT', chapters: 3, categoryEn: 'Pauline Epistles', categoryAm: 'የጳውሎስ መልእክታት' },
  { nameEn: '1 Timothy', nameAm: '1 ጢሞቴዎስ', testament: 'NT', chapters: 6, categoryEn: 'Pauline Epistles', categoryAm: 'የጳውሎስ መልእክታት' },
  { nameEn: '2 Timothy', nameAm: '2 ጢሞቴዎስ', testament: 'NT', chapters: 4, categoryEn: 'Pauline Epistles', categoryAm: 'የጳውሎስ መልእክታት' },
  { nameEn: 'Titus', nameAm: 'ቲቶ', testament: 'NT', chapters: 3, categoryEn: 'Pauline Epistles', categoryAm: 'የጳውሎስ መልእክታት' },
  { nameEn: 'Philemon', nameAm: 'ፊልሞና', testament: 'NT', chapters: 1, categoryEn: 'Pauline Epistles', categoryAm: 'የጳውሎስ መልእክታት' },
  { nameEn: 'Hebrews', nameAm: 'ዕብራውያን', testament: 'NT', chapters: 13, categoryEn: 'General Epistles', categoryAm: 'አጠቃላይ መልእክታት' },
  { nameEn: 'James', nameAm: 'ያዕቆብ', testament: 'NT', chapters: 5, categoryEn: 'General Epistles', categoryAm: 'አጠቃላይ መልእክታት' },
  { nameEn: '1 Peter', nameAm: '1 ጴጥሮስ', testament: 'NT', chapters: 5, categoryEn: 'General Epistles', categoryAm: 'አጠቃላይ መልእክታት' },
  { nameEn: '2 Peter', nameAm: '2 ጴጥሮስ', testament: 'NT', chapters: 3, categoryEn: 'General Epistles', categoryAm: 'አጠቃላይ መልእክታት' },
  { nameEn: '1 John', nameAm: '1 ዮሐንስ', testament: 'NT', chapters: 5, categoryEn: 'General Epistles', categoryAm: 'አጠቃላይ መልእክታት' },
  { nameEn: '2 John', nameAm: '2 ዮሐንስ', testament: 'NT', chapters: 1, categoryEn: 'General Epistles', categoryAm: 'አጠቃላይ መልእክታት' },
  { nameEn: '3 John', nameAm: '3 ዮሐንስ', testament: 'NT', chapters: 1, categoryEn: 'General Epistles', categoryAm: 'አጠቃላይ መልእክታት' },
  { nameEn: 'Jude', nameAm: 'ይሁዳ', testament: 'NT', chapters: 1, categoryEn: 'General Epistles', categoryAm: 'አጠቃላይ መልእክታት' },
  { nameEn: 'Revelation', nameAm: 'የዮሐንስ ራእይ', testament: 'NT', chapters: 22, categoryEn: 'Prophecy', categoryAm: 'ትንቢት' }
];

export const BIBLE_QUOTES_LIBRARY: BibleVerse[] = [
  {
    id: 'bv-1',
    refEn: 'Psalm 23:1-3',
    refAm: 'መዝሙረ ዳዊት 23:1-3',
    textEn: 'The Lord is my shepherd; I shall not want. He makes me lie down in green pastures. He leads me beside still waters. He restores my soul.',
    textAm: 'እግዚአብሔር እረኛዬ ነው፥ የሚያሳጣኝም የለም። በለመለመ መስክ ያሳድረኛል፤ በዕረፍት ውኃ ዘንድ ይመራኛል። ነፍሴን መለሳት።',
    theme: 'Peace & Provision',
    themeAm: 'ሰላምና አቅርቦት',
    category: 'peace'
  },
  {
    id: 'bv-2',
    refEn: 'Proverbs 3:5-6',
    refAm: 'ምሳሌ 3:5-6',
    textEn: 'Trust in the Lord with all your heart, and do not lean on your own understanding. In all your ways acknowledge Him, and He will make straight your paths.',
    textAm: 'በፍጹም ልብህ በእግዚአብሔር ታመን፥ በራስህም ማስተዋል አትደገፍ፤ በመንገድህ ሁሉ እርሱን እወቅ፥ እርሱም ጎዳናህን ያቀናልሃል።',
    theme: 'Trust & Guidance',
    themeAm: 'መታመንና መምራት',
    category: 'faith'
  },
  {
    id: 'bv-3',
    refEn: 'Philippians 4:6-7',
    refAm: 'ፊልጵስዩስ 4:6-7',
    textEn: 'Do not be anxious about anything, but in everything by prayer and supplication with thanksgiving let your requests be made known to God. And the peace of God, which surpasses all understanding, will guard your hearts.',
    textAm: 'በነገር ሁሉ በጸሎትና በምልጃ ከምስጋና ጋር በእግዚአብሔር ዘንድ ልመናችሁን አስታውቁ እንጂ በአንዳች አትጨነቁ። አእምሮንም ሁሉ የሚያልፍ የእግዚአብሔር ሰላም ልባችሁን ይጠብቃል።',
    theme: 'Peace Over Anxiety',
    themeAm: 'ሰላም በጭንቀት ፈንታ',
    category: 'peace'
  },
  {
    id: 'bv-4',
    refEn: 'Isaiah 40:31',
    refAm: 'ኢሳይያስ 40:31',
    textEn: 'Those who wait for the Lord shall renew their strength; they shall mount up with wings like eagles; they shall run and not be weary; they shall walk and not faint.',
    textAm: 'እግዚአብሔርን በመተማመን የሚጠባበቁ ግን ኃይላቸውን ያድሳሉ፤ እንደ ንስር በክንፍ ይወጣሉ፤ ይሮጣሉ፥ አይታክቱም፤ ይሄዳሉ፥ አይደክሙም።',
    theme: 'Strength & Renewal',
    themeAm: 'ብርታትና መታደስ',
    category: 'strength'
  },
  {
    id: 'bv-5',
    refEn: 'Romans 8:28',
    refAm: 'ሮሜ 8:28',
    textEn: 'And we know that for those who love God all things work together for good, for those who are called according to His purpose.',
    textAm: 'እግዚአብሔርንም ለሚወዱት እንደ አሳቡም ለተጠሩት ነገር ሁሉ ለበጎ እንዲደረግ እናውቃለን።',
    theme: 'Godly Purpose',
    themeAm: 'መለኮታዊ ዓላማ',
    category: 'hope'
  },
  {
    id: 'bv-6',
    refEn: 'Joshua 1:9',
    refAm: 'ኢያሱ 1:9',
    textEn: 'Have I not commanded you? Be strong and courageous. Do not be frightened, and do not be dismayed, for the Lord your God is with you wherever you go.',
    textAm: 'በውኑ አላዘዝሁህምን? ጽና፥ አይዞህ፤ አትፍራ፥ አትደንግጥ፤ የምትሄድበት ሁሉ አምላክህ እግዚአብሔር ከአንተ ጋር ነውና።',
    theme: 'Courage & Presence',
    themeAm: 'ጽናትና የአምላክ አብሮነት',
    category: 'strength'
  },
  {
    id: 'bv-7',
    refEn: 'Jeremiah 29:11',
    refAm: 'ኤርምያስ 29:11',
    textEn: '"For I know the plans I have for you," declares the Lord, "plans for welfare and not for evil, to give you a future and a hope."',
    textAm: 'ለእናንተ የማስባትን አሳብ እኔ አውቃለሁ፤ ፍጻሜና ተስፋ እሰጣችሁ ዘንድ የሰላም አሳብ ነው እንጂ የክፉ ነገር አይደለም።',
    theme: 'Hope & Future',
    themeAm: 'ተስፋና ሰላም',
    category: 'hope'
  },
  {
    id: 'bv-8',
    refEn: 'Philippians 4:13',
    refAm: 'ፊልጵስዩስ 4:13',
    textEn: 'I can do all things through Christ who strengthens me.',
    textAm: 'ኃይልን በሚሰጠኝ በክርስቶስ ሁሉን እችላለሁ።',
    theme: 'All Sufficiency',
    themeAm: 'ሁሉን ቻይነት',
    category: 'strength'
  },
  {
    id: 'bv-9',
    refEn: 'John 14:27',
    refAm: 'ዮሐንስ 14:27',
    textEn: 'Peace I leave with you; my peace I give to you. Not as the world gives do I give to you. Let not your hearts be troubled, neither let them be afraid.',
    textAm: 'ሰላምን እተውላችኋለሁ፥ ሰላሜን እሰጣችኋለሁ፤ እኔ የምሰጣችሁ ዓለም እንደሚሰጥ አይደለም። ልባችሁ አይታወክ አይፍራም።',
    theme: 'Divine Peace',
    themeAm: 'መለኮታዊ ሰላም',
    category: 'peace'
  },
  {
    id: 'bv-10',
    refEn: '2 Timothy 1:7',
    refAm: '2 ጢሞቴዎስ 1:7',
    textEn: 'For God gave us a spirit not of fear but of power and love and self-control.',
    textAm: 'እግዚአብሔር የኃይልና የፍቅር ራስንም የመግዛት መንፈስ እንጂ የፍርሃት መንፈስ አልሰጠንምና።',
    theme: 'Sound Mind & Power',
    themeAm: 'ኃይልና ራስን መግዛት',
    category: 'strength'
  },
  {
    id: 'bv-11',
    refEn: 'Matthew 6:33',
    refAm: 'ማቴዎስ 6:33',
    textEn: 'But seek first the kingdom of God and His righteousness, and all these things will be added to you.',
    textAm: 'ነገር ግን አስቀድማችሁ የእግዚአብሔርን መንግሥት ጽድቁንም ፈልጉ፥ ይህም ሁሉ ይጨመርላችኋል።',
    theme: 'Priority of the Kingdom',
    themeAm: 'ቀዳሚው መንግሥት',
    category: 'wisdom'
  },
  {
    id: 'bv-12',
    refEn: 'Psalm 46:1',
    refAm: 'መዝሙረ ዳዊት 46:1',
    textEn: 'God is our refuge and strength, a very present help in trouble.',
    textAm: 'እግዚአብሔር መጠጊያችንና ኃይላችን፥ በሚደርስብን መከራ ሁሉ ታላቅ ረዳታችን ነው።',
    theme: 'Refuge & Help',
    themeAm: 'መጠጊያና ረዳት',
    category: 'strength'
  },
  {
    id: 'bv-13',
    refEn: 'Psalm 91:1-2',
    refAm: 'መዝሙረ ዳዊት 91:1-2',
    textEn: 'He who dwells in the shelter of the Most High will abide in the shadow of the Almighty. I will say to the Lord, "My refuge and my fortress, my God, in whom I trust."',
    textAm: 'በልዑል መጠጊያ የሚኖር ሁሉን በሚችል አምላክ ጥላ ውስጥ ያድራል። እግዚአብሔርን፦ «መሸሸጊያዬ፥ አምባዬ፥ የምታመንበት አምላኬ» እለዋለሁ።',
    theme: 'Divine Protection',
    themeAm: 'መለኮታዊ ጥበቃ',
    category: 'peace'
  },
  {
    id: 'bv-14',
    refEn: 'Romans 12:2',
    refAm: 'ሮሜ 12:2',
    textEn: 'Do not be conformed to this world, but be transformed by the renewal of your mind, that by testing you may discern what is the will of God, what is good and acceptable and perfect.',
    textAm: 'የእግዚአብሔር ፈቃድ እርሱም መልካምና ደስ የሚያሰኝ ፍጹምም የሆነው ነገር ምን እንደ ሆነ ፈትናችሁ ታውቁ ዘንድ በልባችሁ መታደስ ተለወጡ እንጂ ይህን ዓለም አትምሰሉ።',
    theme: 'Mind Renewal',
    themeAm: 'የልብ መታደስ',
    category: 'wisdom'
  },
  {
    id: 'bv-15',
    refEn: 'Galatians 5:22-23',
    refAm: 'ገላትያ 5:22-23',
    textEn: 'The fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, self-control; against such things there is no law.',
    textAm: 'የመንፈስ ፍሬ ግን ፍቅር፥ ደስታ፥ ሰላም፥ ትዕግሥት፥ ቸርነት፥ በጎነት፥ እምነት፥ የውሃት፥ ራስን መግዛት ነው። እንደነዚህ ያሉትን የሚከለክል ሕግ የለም።',
    theme: 'Fruit of the Spirit',
    themeAm: 'የመንፈስ ፍሬ',
    category: 'love'
  },
  {
    id: 'bv-16',
    refEn: '1 Corinthians 13:4-7',
    refAm: '1 ቆሮንቶስ 13:4-7',
    textEn: 'Love is patient and kind; love does not envy or boast; it is not arrogant or rude. It does not insist on its own way; it is not irritable or resentful; it bears all things, believes all things, hopes all things, endures all things.',
    textAm: 'ፍቅር ይታገሣል፥ ቸርነትንም ያደርጋል፤ ፍቅር አይቀናም፤ ፍቅር አይመካም፥ አይታበይም፤ አግባብ ያልሆነውን አያደርግም፥ የራሱንም አይፈልግም፥ አይበሳጭም፥ በደልን አይቆጥርም፤ ሁሉን ይታገሣል፥ ሁሉን ያምናል፥ ሁሉን ተስፋ ያደርጋል፥ በሁሉ ይጸናል።',
    theme: 'True Love',
    themeAm: 'ፍጹም ፍቅር',
    category: 'love'
  },
  {
    id: 'bv-17',
    refEn: 'Lamentations 3:22-23',
    refAm: 'ሰቆቃወ ኤርምያስ 3:22-23',
    textEn: 'The steadfast love of the Lord never ceases; His mercies never come to an end; they are new every morning; great is your faithfulness.',
    textAm: 'ያልጠፋነው ከእግዚአብሔር ምሕረት የተነሣ ነው፤ ርኅራኄው አያልቅምና። ማለዳ ማለዳ አዲስ ነው፤ ታማኝነትህ ታላቅ ነው።',
    theme: 'New Mercies',
    themeAm: 'የማለዳ ምሕረት',
    category: 'praise'
  },
  {
    id: 'bv-18',
    refEn: 'Psalm 119:105',
    refAm: 'መዝሙረ ዳዊት 119:105',
    textEn: 'Your word is a lamp to my feet and a light to my path.',
    textAm: 'ሕግህ ለእግሬ መብራት፥ ለመንገዴም ብርሃን ነው።',
    theme: 'Illuminated Path',
    themeAm: 'የሕይወት ብርሃን',
    category: 'wisdom'
  },
  {
    id: 'bv-19',
    refEn: 'Hebrews 11:1',
    refAm: 'ዕብራውያን 11:1',
    textEn: 'Now faith is the assurance of things hoped for, the conviction of things not seen.',
    textAm: 'እምነትም ተስፋ ስለምናደርገው ነገር የሚያስረግጥ፥ የማናየውንም ነገር የሚያስረዳ ነው።',
    theme: 'Nature of Faith',
    themeAm: 'የእምነት ማንነት',
    category: 'faith'
  },
  {
    id: 'bv-20',
    refEn: 'Psalm 121:1-2',
    refAm: 'መዝሙረ ዳዊት 121:1-2',
    textEn: 'I lift up my eyes to the hills. From where does my help come? My help comes from the Lord, who made heaven and earth.',
    textAm: 'ዓይኖቼን ወደ ተራሮች አነሣለሁ፤ ረዳቴ ከወዴት ይመጣል? ረዳቴ ሰማይንና ምድርን ከሠራ ከእግዚአብሔር ዘንድ ነው።',
    theme: 'Unfailing Help',
    themeAm: 'የማያቋርጥ ረዳት',
    category: 'faith'
  },
  {
    id: 'bv-21',
    refEn: 'Colossians 3:12-14',
    refAm: 'ቈላስይስ 3:12-14',
    textEn: 'Put on then, as God\'s chosen ones, holy and beloved, compassionate hearts, kindness, humility, meekness, and patience, bearing with one another and, if one has a complaint against another, forgiving each other.',
    textAm: 'እንግዲህ እንደ እግዚአብሔር ምርጦች ቅዱሳንና ተወዳጆች ሆናችሁ፥ ምሕረትን፥ ቸርነትን፥ ትሕትናን፥ የዋህነትን፥ ትዕግሥትን ልበሱ፤ እርስ በርሳችሁ ተቻቻሉ፥ አንዱም በአንዱ ላይ ቅር የተሰኘበት ነገር ቢኖር ይቅር ተባባሉ።',
    theme: 'Grace & Forgiveness',
    themeAm: 'ጸጋና ይቅርታ',
    category: 'love'
  },
  {
    id: 'bv-22',
    refEn: 'James 1:5',
    refAm: 'ያዕቆብ 1:5',
    textEn: 'If any of you lacks wisdom, you should ask God, who gives generously to all without finding fault, and it will be given to you.',
    textAm: 'ከእናንተ ግን ማንም ጥበብ ቢጎድለው፥ ሳይነቅፍ ለሁሉም በልግስና የሚሰጠውን እግዚአብሔርን ይለምን፥ ለእርሱም ይሰጠዋል።',
    theme: 'Generous Wisdom',
    themeAm: 'የእግዚአብሔር ጥበብ',
    category: 'wisdom'
  },
  {
    id: 'bv-23',
    refEn: 'Romans 8:38-39',
    refAm: 'ሮሜ 8:38-39',
    textEn: 'For I am sure that neither death nor life, nor angels nor rulers, nor things present nor things to come, nor powers, nor height nor depth, nor anything else in all creation, will be able to separate us from the love of God in Christ Jesus our Lord.',
    textAm: 'ሞት ቢሆን፥ ሕይወትም ቢሆን፥ መላእክትም ቢሆኑ፥ ግዛትም ቢሆን፥ ያለውም ቢሆን፥ የሚመጣውም ቢሆን፥ ኃይላትም ቢሆኑ፥ ከፍታም ቢሆን፥ ዝቅታም ቢሆን፥ ልዩ ፍጥረትም ቢሆን በክርስቶስ ኢየሱስ በጌታችን ካለው ከእግዚአብሔር ፍቅር ሊለየን እንዳይችል ተረድቼአለሁ።',
    theme: 'Inseparable Love',
    themeAm: 'የማይለየን ፍቅር',
    category: 'love'
  },
  {
    id: 'bv-24',
    refEn: '1 Thessalonians 5:16-18',
    refAm: '1 ተሰሎንቄ 5:16-18',
    textEn: 'Rejoice always, pray without ceasing, give thanks in all circumstances; for this is the will of God in Christ Jesus for you.',
    textAm: 'ሁልጊዜ ደስ ይበላችሁ፤ ሳታቋርጡ ጸልዩ፤ በሁሉ አመስግኑ፤ ይህ የእግዚአብሔር ፈቃድ በክርስቶስ ኢየሱስ ወደ እናንተ ነውና።',
    theme: 'Continual Prayer & Joy',
    themeAm: 'ያለማቋረጥ መጸለይ',
    category: 'praise'
  },
  {
    id: 'bv-25',
    refEn: 'Psalm 103:1-3',
    refAm: 'መዝሙረ ዳዊት 103:1-3',
    textEn: 'Bless the Lord, O my soul, and all that is within me, bless His holy name! Bless the Lord, O my soul, and forget not all His benefits, who forgives all your iniquity, who heals all your diseases.',
    textAm: 'ነፍሴ ሆይ፥ እግዚአብሔርን ባርኪ፥ አጥንቶቼም ሁሉ የተቀደሰ ስሙን። ነፍሴ ሆይ፥ እግዚአብሔርን ባርኪ፥ ምስጋናውንም ሁሉ አትርሺ፤ ኃጢአትሽን ሁሉ ይቅር የሚል፥ ደዌሽን ሁሉ የሚፈውስ።',
    theme: 'Bless the Lord',
    themeAm: 'ምስጋና ለእግዚአብሔር',
    category: 'praise'
  },
  {
    id: 'bv-26',
    refEn: 'John 3:16',
    refAm: 'ዮሐንስ 3:16',
    textEn: 'For God so loved the world, that He gave His only Son, that whoever believes in Him should not perish but have eternal life.',
    textAm: 'በእርሱ የሚያምን ሁሉ የዘላለም ሕይወት እንዲኖረው እንጂ እንዳይጠፋ እግዚአብሔር አንድያ ልጁን እስኪሰጥ ድረስ ዓለሙን እንዲሁ ወዶአልና።',
    theme: 'Eternal Life & Grace',
    themeAm: 'የዘላለም ህይወት',
    category: 'salvation'
  },
  {
    id: 'bv-27',
    refEn: 'Ephesians 2:8-9',
    refAm: 'ኤፌሶን 2:8-9',
    textEn: 'For by grace you have been saved through faith. And this is not your own doing; it is the gift of God, not a result of works, so that no one may boast.',
    textAm: 'ጸጋው በእምነት አድኖአችኋልና፤ ይህም የእግዚአብሔር ስጦታ ነው እንጂ ከእናንተ አይደለም፤ ማንም እንዳይመካ ከሥራ አይደለም።',
    theme: 'Saved by Grace',
    themeAm: 'በጸጋ መዳን',
    category: 'salvation'
  },
  {
    id: 'bv-28',
    refEn: '1 Peter 5:7',
    refAm: '1 ጴጥሮስ 5:7',
    textEn: 'Casting all your anxieties on Him, because He cares for you.',
    textAm: 'እርሱ ስለ እናንተ ያስባልና የሚያስጨንቃችሁን ሁሉ በእርሱ ላይ ጣሉት።',
    theme: 'He Cares for You',
    themeAm: 'እርሱ ያስብላችኋል',
    category: 'peace'
  },
  {
    id: 'bv-29',
    refEn: 'Deuteronomy 31:6',
    refAm: 'ኦሪት ዘዳግም 31:6',
    textEn: 'Be strong and courageous. Do not fear or be in dread of them, for it is the Lord your God who goes with you. He will not leave you or forsake you.',
    textAm: 'በርቱ፥ አይዞአችሁ፥ አትፍሩ፥ ከፊታቸውም አትደንግጡ፤ አምላክህ እግዚአብሔር እርሱ ከአንተ ጋር ይሄዳልና፥ አይጥልህም አይተውህም።',
    theme: 'Everlasting Presence',
    themeAm: 'ከቶ አይተውህም',
    category: 'strength'
  },
  {
    id: 'bv-30',
    refEn: 'Proverbs 4:23',
    refAm: 'ምሳሌ 4:23',
    textEn: 'Keep your heart with all vigilance, for from it flow the springs of life.',
    textAm: 'አጥብቀህ ልብህን ጠብቅ፥ የሕይወት መውጫ ከእርሱ ነውና።',
    theme: 'Guarding the Heart',
    themeAm: 'ልብን መጠበቅ',
    category: 'wisdom'
  }
];

export const BIBLE_THEMES_FILTER = [
  { id: 'all', nameEn: 'All Verses', nameAm: 'ሁሉም ቃላት' },
  { id: 'peace', nameEn: 'Peace & Rest', nameAm: 'ሰላምና ዕረፍት' },
  { id: 'strength', nameEn: 'Strength & Courage', nameAm: 'ጥንካሬና ብርታት' },
  { id: 'faith', nameEn: 'Faith & Trust', nameAm: 'እምነትና መታመን' },
  { id: 'wisdom', nameEn: 'Wisdom & Guidance', nameAm: 'ጥበብና መምራት' },
  { id: 'love', nameEn: 'Love & Grace', nameAm: 'ፍቅርና ጸጋ' },
  { id: 'hope', nameEn: 'Hope & Promises', nameAm: 'ተስፋና ቃልኪዳን' },
  { id: 'praise', nameEn: 'Praise & Thanksgiving', nameAm: 'ምስጋናና ክብር' },
  { id: 'salvation', nameEn: 'Salvation & Life', nameAm: 'ደህንነትና ህይወት' }
];
