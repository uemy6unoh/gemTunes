function openAuthModal() {
  document.getElementById("auth-modal").style.display = "block";
  document.getElementById("auth-id").value = "";
  document.getElementById("auth-password").value = "";
}

function closeAuthModal() {
  document.getElementById("auth-modal").style.display = "none";
}

// function login() {
//   const id = document.getElementById("auth-id").value.trim();
//   const pw = document.getElementById("auth-password").value.trim();

//   if (!id || !pw) {
//     alert("아이디와 비밀번호를 모두 입력해주세요.");
//     return;
//   }

//   const users = JSON.parse(localStorage.getItem("users") || "[]");
//   const user = users.find(u => u.id === id && u.password === pw);

//   if (!user) {
//     alert("아이디 또는 비밀번호가 틀렸습니다.");
//     return;
//   }

//   localStorage.setItem("currentUser", JSON.stringify(user));
//   alert(`${user.id}님 환영합니다!`);
//   closeAuthModal();
//   location.reload();
// }
async function login() {
  const id = document.getElementById("auth-id").value.trim();
  const pw = document.getElementById("auth-password").value.trim();

  if (!id || !pw) {
    alert("아이디와 비밀번호를 모두 입력해주세요.");
    return;
  }

  try {
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, pw })
    });

    if (res.ok) {
      const user = await res.json();
      // 로그인 성공하면 서버에서 받은 user 객체를 localStorage에 저장
      localStorage.setItem("currentUser", JSON.stringify(user));
      alert(`${user.id}님 환영합니다!`);
      closeAuthModal();
      location.reload();
    } else {
      // 400/401 응답 텍스트를 그대로 alert
      const msg = await res.text();
      alert(msg);
    }
  } catch (err) {
    console.error(err);
    alert('서버 통신 중 오류가 발생했습니다.');
  }
}


// function signup() {
//   const id = document.getElementById("auth-id").value.trim();
//   const pw = document.getElementById("auth-password").value.trim();

//   if (!id || !pw) {
//     alert("아이디와 비밀번호를 모두 입력해주세요.");
//     return;
//   }

//   let users = JSON.parse(localStorage.getItem("users") || "[]");

//   if (users.some(u => u.id === id)) {
//     alert("이미 존재하는 아이디입니다.");
//     return;
//   }

//   users.push({ id, password: pw });
//   localStorage.setItem("users", JSON.stringify(users));
//   alert("회원가입이 완료되었습니다. 로그인해주세요!");
// }
async function signup() {
  const id = document.getElementById("auth-id").value.trim();
  const pw = document.getElementById("auth-password").value.trim();
  if (!id || !pw) {
    alert("아이디와 비밀번호를 모두 입력해주세요.");
    return;
  }

  try {
    const res = await fetch('/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, pw })
    });
    if (res.ok) {
      const newUser = await res.json();
      alert(`${newUser.user} 회원가입 완료! 로그인 해주세요.`);
      closeAuthModal();
    } else {
      const msg = await res.text();
      alert(msg);
    }
  } catch (e) {
    alert('서버 통신 중 오류가 발생했습니다.');
    console.error(e);
  }
}


// 로그인 상태이면 버튼 텍스트 변경
window.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  const logo = document.querySelector("h1.logo");

  if (logo) {
    if (user) {
      logo.innerText = `${user.id}님 환영합니다!`;
    } else {
      logo.innerText = "당신의 음악을 공유해보세요!";
    }
  }
});
function logout() {
  localStorage.removeItem("currentUser");
  alert("로그아웃 되었습니다.");
  location.reload();
}

window.addEventListener("DOMContentLoaded", () => {
  const user = JSON.parse(localStorage.getItem("currentUser"));
  const logo = document.querySelector("h1.logo");
  const logoutBtn = document.getElementById("logout-btn");

  if (logo) {
    logo.innerText = user
      ? `${user.id}님 환영합니다!`
      : "당신의 음악을 공유해보세요!";
  }

  if (logoutBtn) {
    logoutBtn.style.display = user ? "inline-block" : "none";
  }
});

// 마이 페이지 연동
const mypageLink = document.getElementById("mypage-link");

if (mypageLink) {
  mypageLink.addEventListener("click", (e) => {
    const user = JSON.parse(localStorage.getItem("currentUser"));

    if (!user) {
      e.preventDefault(); // 링크 이동 막기
      alert("로그인 후 이용해주세요.");
    } else {
      // 사용자 ID를 쿼리로 넘겨줌 (예: mypage.html?user=user01)
      mypageLink.href = `mypage.html?user=${user.id}`;
      mypageLink.target = "_blank";
    }
  });
}
