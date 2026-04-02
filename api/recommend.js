export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, birth } = req.body;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 5000,
      messages: [{ role: 'user', content: `천주교 세례명 전문가로서 아래 정보를 바탕으로 세례명 3가지를 추천하세요.\n이름: ${name} / 생년월일: ${birth}\n\n순수한 JSON만 출력 (코드블럭 없이):\n{"intro_line":"따뜻한 한줄 소개","recommendations":[{"type":"종합 추천","type_en":"COMPREHENSIVE","korean_name":"요한","latin_name":"Ioannes","english_name":"John","nickname":"존 (John)","feast_day":"12월 27일","male_honorific":"요한 형제님","female_honorific":"요한나 자매님","patron_of":["작가","사랑"],"saint_story":"2문장 이야기","reason":"2문장 이유","rarity":"클래식"},{"type":"유니크 추천","type_en":"UNIQUE","korean_name":"","latin_name":"","english_name":"","nickname":"","feast_day":"","male_honorific":"","female_honorific":"","patron_of":[],"saint_story":"","reason":"","rarity":"드묾"},{"type":"인기 추천","type_en":"TRENDING","korean_name":"","latin_name":"","english_name":"","nickname":"","feast_day":"","male_honorific":"","female_honorific":"","patron_of":[],"saint_story":"","reason":"","rarity":"요즘 인기"}]}\n\n규칙:\n- 종합=이름음감+생년월일 수호성인 분석\n- 유니크(드묾): 남-다미아노,막시밀리아노,아드리아노,힐라리오,에우게니오,보나벤투라 / 여-젬마,발부르가,앙젤리카,아델라이다,이르미나\n- 인기(요즘 인기): 남-프란치스코,가브리엘,다윗,미카엘,타대오 / 여-마리아,데레사,루치아,소피아,체칠리아\n- 닉네임: 요한→존(John), 사무엘→샘(Sam), 베드로→피터(Peter), 바오로→폴(Paul), 미카엘→마이클(Michael), 가브리엘→가브(Gabe), 마리아→메리(Mary), 엘리사벳→베스(Beth), 루치아→루시(Lucy), 요셉→조(Joe)\n- 성인이야기: 초등생도 알 수 있게 2문장` }]
    })
  });

  const data = await response.json();
  if (data.error) return res.status(400).json({ error: data.error.message });
  res.status(200).json(data);
}
