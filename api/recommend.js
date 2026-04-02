export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, birth, gender } = req.body;
  if (!name || !birth) return res.status(400).json({ error: '이름과 생년월일을 입력해주세요' });

  const isFemale = gender === '여성';
  const seed = Math.floor(Math.random() * 9999);

  const prompt = `천주교 세례명 전문가로서 세례명 3가지를 추천해주세요.
이름: ${name}, 생년월일: ${birth}, 성별: ${gender || '미지정'}, 시도번호: ${seed}

당신은 수천 명의 천주교 성인 전체를 알고 있습니다. 특정 목록에 제한되지 않고 자유롭게 추천하세요.
같은 사람이 다시 시도할 때마다 시도번호(${seed})를 반영해 다른 성인을 추천합니다.

JSON만 출력 (코드블럭 없이). saint_story는 초등생도 이해할 수 있게 2-3문장:

{"intro_line":"20자 이내","recommendations":[
{"type":"종합 추천","type_en":"COMPREHENSIVE","korean_name":"","latin_name":"","english_name":"","nickname":"","feast_day":"","male_honorific":"","female_honorific":"","patron_of":[],"saint_story":"","reason":"","rarity":"클래식"},
{"type":"유니크 추천","type_en":"UNIQUE","korean_name":"","latin_name":"","english_name":"","nickname":"","feast_day":"","male_honorific":"","female_honorific":"","patron_of":[],"saint_story":"","reason":"","rarity":"드묾"},
{"type":"인기 추천","type_en":"TRENDING","korean_name":"","latin_name":"","english_name":"","nickname":"","feast_day":"","male_honorific":"","female_honorific":"","patron_of":[],"saint_story":"","reason":"","rarity":"요즘 인기"}
]}

추천 기준:
- korean_name 필드에 '성(聖)' 접두어 절대 금지. 예) '성 가브리엘' X → '가브리엘' O
- 종합: 이름 음감+생년월일 월일과 축일이 일치하는 성인 최우선. 없으면 이름 의미와 가장 잘 어울리는 성인.
- 유니크: 한국에서 잘 쓰이지 않는 독특하고 아름다운 세례명. 매 시도마다 다른 성인 선택.
- 인기: 요즘 한국 천주교에서 많이 받는 세례명. 매 시도마다 다른 성인 선택.
- ${isFemale
    ? '여성: 여성 성인 또는 남녀공용 성인 추천 가능.'
    : '남성: 남성 성인 또는 남녀공용 성인만 추천. 여성 전용 성인은 절대 추천 금지.'}
- 닉네임: 영어권 별명이 있는 경우만 표기. 예) 요한→존(John), 사무엘→샘(Sam), 베드로→피터(Peter), 바오로→폴(Paul), 미카엘→마이클(Michael), 마리아→메리(Mary), 루치아→루시(Lucy), 엘리사벳→베스(Beth), 요셉→조(Joe), 안토니오→토니(Tony), 세바스티아노→세브(Seb) 등. 없으면 빈칸.
- male_honorific: "○○ 형제님" 형태 (예: 가브리엘 형제님). female_honorific: "○○나 자매님" 또는 "○○ 자매님" 형태 (예: 가브리엘라 자매님). 절대 '성(聖)' 접두어 붙이지 말 것.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  const data = await response.json();
  if (data.error) return res.status(400).json({ error: data.error.message });
  res.status(200).json(data);
}
