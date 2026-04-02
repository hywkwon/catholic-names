export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, birth, gender } = req.body;
  if (!name || !birth) return res.status(400).json({ error: '이름과 생년월일을 입력해주세요' });

  const isFemale = gender === '여성';

  const seed = Math.floor(Math.random() * 1000);
  const prompt = `천주교 세례명 3가지 추천. 이름:${name}, 생년월일:${birth}, 성별:${gender||'미지정'}, 변형번호:${seed}(매번 다른 조합으로 추천)

JSON만 출력 (코드블럭 없이). saint_story는 2-3문장으로, reason은 1-2문장으로:

{"intro_line":"20자 이내","recommendations":[
{"type":"종합 추천","type_en":"COMPREHENSIVE","korean_name":"루치아","latin_name":"Lucia","english_name":"Lucy","nickname":"루시(Lucy)","feast_day":"12월 13일","male_honorific":"루치오 형제님","female_honorific":"루치아 자매님","patron_of":["눈병환자","작가"],"saint_story":"2-3문장 성인 소개","reason":"한 문장 이내 추천 이유","rarity":"클래식"},
{"type":"유니크 추천","type_en":"UNIQUE","korean_name":"","latin_name":"","english_name":"","nickname":"","feast_day":"","male_honorific":"","female_honorific":"","patron_of":[],"saint_story":"2-3문장","reason":"한 문장","rarity":"드묾"},
{"type":"인기 추천","type_en":"TRENDING","korean_name":"","latin_name":"","english_name":"","nickname":"","feast_day":"","male_honorific":"","female_honorific":"","patron_of":[],"saint_story":"2-3문장","reason":"한 문장","rarity":"요즘 인기"}
]}

규칙:
- 종합: 이름 음감+생년월일 수호성인 분석. 생년월일(${birth})의 월일과 정확히 일치하는 축일을 가진 성인이 있으면 최우선 추천.
- ${isFemale
    ? '여성: 남녀공용 성인 + 여성 성인 모두 추천 가능. 유니크(드묾)=젬마,발부르가,앙젤리카,아델라이다,이르미나,빅토리나,콜롬바,아녜스,체칠리아. 인기=마리아,데레사,루치아,소피아,체칠리아,클라라,엘리사벳'
    : '남성: 남녀공용 성인 + 남성 성인만 추천. 여성 전용 성인(마리아,데레사,루치아,소피아,체칠리아,클라라,엘리사벳,젬마,발부르가,앙젤리카,아델라이다,막달레나,아녜스,빅토리나 등)은 절대 추천하지 않음. 유니크(드묾)=다미아노,막시밀리아노,아드리아노,힐라리오,에우게니오,보나벤투라,콘라도. 인기=프란치스코,가브리엘,다윗,미카엘,타대오,요셉,베드로'}
- 닉네임: 요한→존(John), 사무엘→샘(Sam), 베드로→피터(Peter), 바오로→폴(Paul), 미카엘→마이클(Michael), 마리아→메리(Mary), 루치아→루시(Lucy), 엘리사벳→베스(Beth), 요셉→조(Joe)
- 변형번호(${seed})에 따라 매번 다른 성인 조합을 추천. 같은 이름+생년월일이어도 시도마다 종합/유니크/인기 후보를 다르게 선택. 특히 유니크와 인기 추천은 후보풀에서 랜덤하게 선택할 것`;

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
