<p align="center">
<img src="https://github.com/user-attachments/assets/59398936-3de8-404e-877e-dd44435bd8ae" alt="올클 메인 이미지" width="690" />
</p>

# 🌀 올클 브라우저 모니터링 (Allcll Browser Monitoring)

**올클 브라우저 모니터링**은 세종대 수강신청 도우미 **올클(ALLCLL)** 서비스의 데이터 최신성과 UI 무결성을 검증하기 위한 Playwright 기반의 E2E 테스트 및 모니터링 도구입니다.

학생들에게 정확한 수강신청 정보를 제공하기 위해, 실제 서비스 환경에서 데이터가 정상적으로 갱신되고 있는지 24시간 감시합니다.

---

## 🎯 목적

이 프로젝트는 올클 서비스의 신뢰성을 보장하기 위해 두 가지 핵심 목적을 가집니다.

*   **CI 테스트 (정적 검증):** 개발 단계에서 상대 시간 UI 로직(예: "5분 전")이 깨지지 않았는지 검증합니다.
*   **운영 모니터링 (동적 검증):** 실제 운영 환경에서 크롤링 데이터가 허용된 지연 시간 내에 갱신되고 있는지 주기적으로 확인합니다.

---

## 🔍 주요 기능

### 1. 데이터 최신성 모니터링

*   수강신청 기간 동안 가장 중요한 것은 **"실시간 여석 정보"**입니다.
*   이 도구는 `data-crawled-at` 타임스탬프를 확인하여, 데이터가 현재 시각 기준으로 **1시간(기본값) 이내**에 갱신되었는지 검증합니다.
*   만약 데이터 갱신이 멈추거나 지연되면, 즉시 관리자에게 알림을 보냅니다.

### 2. 상대 시간 UI 검증

*   사용자에게 "방금 전", "5분 전"과 같이 직관적인 시간 정보를 제공하는 UI가 올바르게 작동하는지 테스트합니다.
*   CI 환경에서는 시간을 고정(Mocking)하여 로직의 정확성을 보장합니다.

### 3. 유연한 스케줄링 및 알림

*   **GitHub Actions**를 통해 수강신청 기간(날짜, 시간)에 맞춰 자동으로 모니터링이 실행됩니다.
*   장애 발생 시 **Discord Webhook**을 통해 문제의 심각도(INFO, WARNING, CRITICAL)에 따라 알림을 전송합니다.

---

## 🛠️ 기술 스택

*   **Framework:** [Playwright](https://playwright.dev/)
*   **Language:** TypeScript
*   **CI/CD:** GitHub Actions
*   **Notification:** Discord Webhook

---

## 🚀 시작하기

### 필수 조건

*   Node.js (v18 이상)
*   pnpm (또는 npm/yarn)

### 설치

```bash
git clone https://github.com/allcll/allcll-browser-monitoring.git
cd allcll-browser-monitoring
pnpm install
```

### 테스트 실행

**1. CI 테스트 (로직 검증)**

UI 로직이 올바른지 확인하는 정적 테스트입니다.

```bash
pnpm test:ci
# 또는
npx playwright test --grep-invert @monitoring
```

**2. 모니터링 테스트 (운영 환경 검증)**

실제 라이브 서버를 대상으로 데이터 갱신 여부를 확인합니다.

```bash
pnpm test:monitor
# 또는
npx playwright test --grep @monitoring
```

---

## ⚙️ 환경 설정

모니터링 동작은 환경 변수를 통해 제어할 수 있습니다. 수강신청 기간에 맞춰 유연하게 변경 가능합니다.

| 변수명 | 설명 | 예시 |
| :--- | :--- | :--- |
| `MONITOR_START_DATE` | 모니터링 시작일 (YYYY-MM-DD) | `2024-03-01` |
| `MONITOR_END_DATE` | 모니터링 종료일 (YYYY-MM-DD) | `2024-03-05` |
| `MONITOR_START_HOUR` | 일일 시작 시간 (0-23) | `10` |
| `MONITOR_END_HOUR` | 일일 종료 시간 (0-23) | `17` |
| `DISCORD_WEBHOOK_URL` | 알림을 받을 Discord Webhook URL | `https://discord.com/...` |

---

## 📊 모니터링 로직

### 상태 판단 기준

모니터링 테스트는 현재 시각(`now`)과 데이터 갱신 시각(`data-crawled-at`)의 차이를 계산합니다.

```
지연 시간 = 현재 시각 - 데이터 갱신 시각
```

*   **정상:** 지연 시간 <= 허용 임계값 (기본 1시간)
*   **장애:** 지연 시간 > 허용 임계값 (데이터 갱신 중단 의심)

### SSE 연결 상태 간접 검증
직접적인 SSE 연결 이벤트보다는, **"결과적으로 데이터가 갱신되었는가"**를 확인하여 실제 사용자 경험에 기반한 장애 여부를 판단합니다.

---

혹시, 올클 서비스에 관심이 생기셨다면 **Star**를 눌러주세요. ⭐️

작은 관심이 서비스 운영에 큰 도움이 됩니다! 감사합니다. :)
