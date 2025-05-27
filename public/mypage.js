// public/mypage.js

// 마이페이지 로직
document.addEventListener('DOMContentLoaded', () => {
  // 1) 현재 로그인된 유저 정보 확인
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  if (!currentUser) {
    alert('로그인 후 이용해주세요.');
    return location.href = '/';
  }
  const userId = currentUser.user;

  // 2) 페이지 로드 시 사용자 정보(제목 + 곡 목록) 가져오기
  loadUser(userId);

  // 3) “제목 수정” 버튼 → 수정 모드 토글
  document
    .getElementById('edit-playlist-name-btn')
    .addEventListener('click', () => {
      document.getElementById('playlist-title-edit').style.display = 'block';
    });

  // 4) “저장” 버튼 → 제목 업데이트
  document
    .getElementById('save-playlist-name-btn')
    .addEventListener('click', () => updatePlaylistName(userId));

  // 5) “노래 추가” 버튼 핸들러
  document
    .getElementById('add-song-btn')
    .addEventListener('click', () => addSong(userId));
});

// 사용자 정보(제목 + 곡 배열) 불러오기
async function loadUser(userId) {
  const res = await fetch(`/user/${userId}`);
  if (!res.ok) {
    alert('유저 정보를 불러오지 못했습니다.');
    return;
  }
  const user = await res.json();

  // (A) 제목 표시: pl_name이 없으면 기본값
  const title = user.pl_name && user.pl_name.trim() !== ''
    ? user.pl_name
    : `${user.id}님의 플레이리스트`;
  document.getElementById('playlist-title-display').textContent = title;

  // (B) 수정 input 기본값 세팅
  document.getElementById('playlist-name-input').value = title;

  // 로컬스토리지 갱신 및 곡 목록 렌더링
  localStorage.setItem('currentUser', JSON.stringify(user));
  renderPlaylist(user.pl_array);
}

// 플레이리스트 제목 저장
async function updatePlaylistName(userId) {
  const plName = document.getElementById('playlist-name-input').value.trim();
  if (!plName) {
    alert('플레이리스트 제목을 입력해주세요.');
    return;
  }

  const res = await fetch(`/user/${userId}/playlist-name`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pl_name: plName })
  });

  if (res.ok) {
    const updatedUser = await res.json();
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));

    // 화면에 반영
    document.getElementById('playlist-title-display').textContent = plName;
    document.getElementById('playlist-title-edit').style.display = 'none';
    alert('플레이리스트 제목이 저장되었습니다.');
  } else {
    const msg = await res.text();
    alert(msg);
  }
}

// 플레이리스트 곡 목록 렌더링
async function renderPlaylist(plArray) {
  const songsRes = await fetch('/songs');
  const songsData = await songsRes.json();
  const ul = document.getElementById('playlist-list');
  ul.innerHTML = '';

  plArray.forEach(songId => {
    const artistId   = songId.slice(0, 3);
    const songNumber = songId.slice(3);

    // artist name 찾기
    const artist = Object.keys(songsData)
      .find(name => songsData[name].artist_id === artistId);

    // title 찾기
    const title = artist
      ? songsData[artist].songs[songNumber]
      : '알 수 없는 곡';

    const li = document.createElement('li');
    // 여기서 “아티스트 – 곡명”으로 표시합니다
    li.textContent = `${artist} - ${title}`;
    ul.appendChild(li);
  });
}

// 노래 추가
async function addSong(userId) {
  const artist = document.getElementById('artist-input').value.trim();
  const title  = document.getElementById('title-input').value.trim();
  if (!artist || !title) {
    return alert('가수명과 곡 제목을 모두 입력해주세요.');
  }

  const res = await fetch('/addSong', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ artist, title, userId })
  });

  if (res.ok) {
    const { song_id } = await res.json();
    alert(`곡 추가 완료: ${song_id}`);
    loadUser(userId);  // 제목+곡 목록 모두 리로드
  } else {
    const msg = await res.text();
    alert(msg);
  }
}

// 로그아웃
function logout() {
  localStorage.removeItem('currentUser');
  alert('로그아웃 되었습니다.');
  location.href = '/';
}
