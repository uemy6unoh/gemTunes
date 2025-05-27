// server.js
const express = require('express');
const fs      = require('fs');
const path    = require('path');

const app = express();

// === JSON 파일 경로 설정 ===
const DATA_DIR   = path.join(__dirname, 'data');
const USER_FILE  = path.join(DATA_DIR, 'user.json');
const SONG_FILE  = path.join(DATA_DIR, 'song.json');

// === 미들웨어 ===
// JSON 바디 파싱
app.use(express.json());
// public 폴더를 정적 서빙 루트로 설정
app.use(express.static(path.join(__dirname, 'public')));

// === 유틸 함수 ===
function readUsers() {
  return JSON.parse(fs.readFileSync(USER_FILE, 'utf-8') || '[]');
}
function writeUsers(users) {
  fs.writeFileSync(USER_FILE, JSON.stringify(users, null, 2), 'utf-8');
}

function readSongs() {
  return JSON.parse(fs.readFileSync(SONG_FILE, 'utf-8') || '{}');
}
function writeSongs(songs) {
  fs.writeFileSync(SONG_FILE, JSON.stringify(songs, null, 2), 'utf-8');
}

// === 테스트용 ping 라우트 ===
app.get('/ping', (req, res) => {
  res.send('pong');
});

// === 회원가입 ===
app.post('/signup', (req, res) => {
  const { id, pw } = req.body;
  if (!id || !pw) {
    return res.status(400).send('id와 pw를 모두 전송해야 합니다.');
  }

  const users = readUsers();
  if (users.some(u => u.id === id)) {
    return res.status(409).send('이미 존재하는 아이디입니다.');
  }

  const maxNum = users.length === 0
    ? 0
    : Math.max(...users.map(u => parseInt(u.user.slice(1), 10)));
  const newUser = {
    user: `U${String(maxNum + 1).padStart(3, '0')}`,
    id,
    pw,
    pl_name: `${id}님의 플레이리스트`,
    pl_genre: [],
    pl_array: [],
    pl_cmt: {},
    zzim_list: []
  };

  users.push(newUser);
  writeUsers(users);
  return res.status(201).json(newUser);
});

// === 로그인 ===
app.post('/login', (req, res) => {
  const { id, pw } = req.body;
  if (!id || !pw) {
    return res.status(400).send('id와 pw를 모두 전송해야 합니다.');
  }

  const users = readUsers();
  const user = users.find(u => u.id === id && u.pw === pw);
  if (!user) {
    return res.status(401).send('아이디 또는 비밀번호가 틀렸습니다.');
  }

  return res.status(200).json(user);
});

// === 사용자 정보 조회 ===
app.get('/user/:userId', (req, res) => {
  const users = readUsers();
  const user = users.find(u => u.user === req.params.userId);
  if (!user) return res.status(404).send('User not found');
  res.json(user);
});

// 전체 유저 리스트 응답
app.get('/userList', (req, res) => {
  const users = readUsers();
  res.json(users);
});

// === 전체 곡 데이터 조회 ===
app.get('/songs', (req, res) => {
  res.json(readSongs());
});


// === 노래 추가 (song.json & user.json 동시 업데이트) ===
app.post('/addSong', (req, res) => {
  const { artist, title, userId } = req.body;
  if (!artist || !title || !userId) {
    return res.status(400).send('artist, title, userId가 필요합니다.');
  }

  // 1) song.json 읽기
  const songsArr = readSongs(); // 배열 형태

  // 2) 아티스트 엔트리 찾기 or 신규 생성
  let entry = songsArr.find(e => e.artist_name === artist);
  if (!entry) {
    const existingIds = songsArr.map(e => parseInt(e.artist_id, 10));
    const maxId     = existingIds.length ? Math.max(...existingIds) : 100;
    const artistId  = String(maxId + 1).padStart(3, '0');
    entry = { artist_name: artist, artist_id: artistId, songs: {} };
    songsArr.push(entry);
  }
  const artistId = entry.artist_id;

  // 3) 같은 제목이 이미 있나 확인
  let songKey = Object.entries(entry.songs)
    .find(([num, name]) => name === title)?.[0];

  // 4) 없으면 새 곡 번호(901,902…) 생성
  if (!songKey) {
    const existingNums = Object.keys(entry.songs)
      .map(n => parseInt(n, 10));
    const nextNum = existingNums.length
      ? Math.max(...existingNums) + 1
      : 901;
    songKey = String(nextNum).padStart(3, '0');
    entry.songs[songKey] = title;
    writeSongs(songsArr);
  }

  const songId = artistId + songKey;

  // 5) user.json 읽기
  const users = readUsers();
  const user  = users.find(u => u.user === userId);
  if (!user) return res.status(404).send('User not found');

  // 6) 이미 내 플레이리스트에 있나?
  if (user.pl_array.includes(songId)) {
    return res.status(400).send('이미 추가된 곡입니다.');
  }
  if (user.pl_array.length >= 6) {
    return res.status(400).send('플레이리스트 곡은 최대 6개까지 가능합니다.');
  }

  // 7) 내 플레이리스트에 추가 & 저장
  user.pl_array.push(songId);
  writeUsers(users);

  // 8) 결과 반환
  res.json({ song_id: songId });
});

//  사용자 정보 조회: GET /user/:userId
// 이미 있는 코드 아래쯤에 붙여 넣으세요.
// ===============================================
app.put('/user/:userId/playlist-name', (req, res) => {
  const { userId } = req.params;
  const { pl_name } = req.body;

  if (!pl_name || pl_name.trim() === '') {
    return res.status(400).send('플레이리스트 제목을 입력해주세요.');
  }

  const users = readUsers();
  const user  = users.find(u => u.user === userId);
  if (!user) {
    return res.status(404).send('User not found');
  }

  user.pl_name = pl_name.trim();
  writeUsers(users);

  // 변경된 사용자 정보 반환
  return res.json(user);
});
  

// === 서버 기동 ===
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
