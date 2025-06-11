<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>관리자 로그인</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      margin: 0;
      background-color: #0e0e0e;
      color: #f0f0f0;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      background: #1a1a1a;
      padding: 32px;
      border-radius: 12px;
      box-shadow: 0 0 30px rgba(0,0,0,0.5);
      width: 100%;
      max-width: 1000px;
    }
    h1 {
      text-align: center;
      color: #ffffff;
      margin-bottom: 24px;
    }
    input {
      width: 100%;
      padding: 12px;
      font-size: 16px;
      border: 1px solid #333;
      border-radius: 6px;
      margin-bottom: 16px;
      background-color: #2a2a2a;
      color: #f0f0f0;
    }
    button {
      padding: 12px 24px;
      font-size: 16px;
      font-weight: 600;
      background-color: #444;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      width: 100%;
    }
    button:hover {
      background-color: #666;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 24px;
      overflow-x: auto;
    }
    th, td {
      padding: 12px;
      border-bottom: 1px solid #333;
      text-align: center;
      cursor: pointer;
    }
    th {
      background-color: #111;
      color: #fff;
    }
    tr:hover {
      background-color: #1e1e1e;
    }
    .action-buttons {
      display: flex;
      gap: 10px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .action-buttons button {
      flex: 1;
      min-width: 120px;
    }
    canvas {
      background-color: #fff;
      border-radius: 8px;
      padding: 16px;
      margin-top: 32px;
    }
    img.icon {
      height: 20px;
      vertical-align: middle;
      filter: brightness(200%);
    }
    @media screen and (max-width: 768px) {
      th, td {
        padding: 8px;
        font-size: 14px;
      }
    }
  </style>
</head>
<body>
  <div class="container" id="main">
    <h1><img src="https://cdn-icons-png.flaticon.com/512/3064/3064197.png" class="icon" alt="lock"> 관리자 로그인</h1>
    <input type="password" id="pw" placeholder="관리자 비밀번호 입력" />
    <button onclick="login()">로그인</button>
  </div>

  <script>
    let currentPassword = "";
    let sortDirection = 1;

    function login(refresh = false) {
      const pw = refresh ? currentPassword : document.getElementById("pw").value;
      if (!pw) return;
      currentPassword = pw;

      fetch("/admin/data", {
        headers: { Authorization: "Bearer " + pw },
      })
        .then((res) => res.json())
        .then((data) => {
          const container = document.getElementById("main");
          container.innerHTML = `
            <h1><img src='https://cdn-icons-png.flaticon.com/512/1584/1584891.png' class='icon' alt='list'> Roblox 유저 목록</h1>
            <div class="action-buttons">
              <input type="text" id="search" placeholder="User ID 또는 Username 검색" />
              <button onclick="login(true)"><img src='https://cdn-icons-png.flaticon.com/512/545/545680.png' class='icon' alt='refresh'> 새로고침</button>
            </div>
            <table>
              <thead>
                <tr>
                  <th onclick="sortTable(0)">User ID</th>
                  <th onclick="sortTable(1)">Money</th>
                  <th onclick="sortTable(2)">Playtime</th>
                  <th onclick="sortTable(3)">Username</th>
                  <th onclick="sortTable(4)">Updated</th>
                </tr>
              </thead>
              <tbody id="rows">
                ${Object.entries(data).map(([id, u]) => `
                  <tr>
                    <td>${id}</td>
                    <td>${u.money ?? 0}</td>
                    <td>${u.playtime ?? 0}</td>
                    <td>${u.username ?? 'Unknown'}</td>
                    <td>${new Date(u.updatedAt).toLocaleString()}</td>
                  </tr>`).join('')}
              </tbody>
            </table>
            <canvas id="chart" width="400" height="200"></canvas>
          `;

          document.getElementById("search").addEventListener("input", function() {
            const q = this.value.toLowerCase();
            document.querySelectorAll("#rows tr").forEach(tr => {
              const uid = tr.children[0].textContent.toLowerCase();
              const uname = tr.children[3].textContent.toLowerCase();
              tr.style.display = uid.includes(q) || uname.includes(q) ? '' : 'none';
            });
          });

          drawChart(data);
        })
        .catch(() => alert("❌ 인증 실패 또는 오류 발생"));
    }

    function sortTable(n) {
      const rows = Array.from(document.querySelector("#rows").rows);
      rows.sort((a, b) => {
        const valA = a.cells[n].textContent;
        const valB = b.cells[n].textContent;
        return (valA > valB ? 1 : -1) * sortDirection;
      });
      sortDirection *= -1;
      rows.forEach(row => document.querySelector("#rows").appendChild(row));
    }

    function drawChart(data) {
      const ctx = document.getElementById('chart').getContext('2d');
      const usernames = Object.values(data).map(u => u.username ?? 'Unknown');
      const playtimes = Object.values(data).map(u => u.playtime ?? 0);
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: usernames,
          datasets: [{
            label: 'Playtime',
            data: playtimes,
            backgroundColor: '#90caf9'
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { labels: { color: '#fff' } }
          },
          scales: {
            x: { ticks: { color: '#fff' } },
            y: { ticks: { color: '#fff' } }
          }
        }
      });
    }
  </script>
</body>
</html>
