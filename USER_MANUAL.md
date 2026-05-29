# Research Intelligence Dashboard (RID) — User Manual

**Version:** 1.0  
**Last Updated:** 2025  
**Platform:** macOS / Linux  
**Languages:** English, Chinese (Simplified), Chinese (Traditional), Japanese, Korean, Thai

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Dashboard Overview](#2-dashboard-overview)
3. [Working with Topics](#3-working-with-topics)
4. [Working with Weekly Plans](#4-working-with-weekly-plans)
5. [Understanding AI Analysis](#5-understanding-ai-analysis)
6. [Configuring AI Providers](#6-configuring-ai-providers)
7. [Managing Data Sources](#7-managing-data-sources)
8. [Team Collaboration](#8-team-collaboration)
9. [Settings & Preferences](#9-settings--preferences)
10. [Language Support](#10-language-support)
11. [Mobile Usage](#11-mobile-usage)
12. [Troubleshooting](#12-troubleshooting)
13. [Tips & Best Practices](#13-tips--best-practices)
14. [Keyboard Shortcuts](#14-keyboard-shortcuts)
15. [FAQ](#15-frequently-asked-questions)
16. [Glossary](#16-glossary)

---

## 1. Getting Started

Welcome to the Research Intelligence Dashboard (RID) — your AI-powered research assistant that runs locally on your machine for maximum privacy and control. RID helps teams gather news, analyze trends, and create business plans using cutting-edge AI, all while keeping your data secure.

### 1.1 System Requirements

Before installing RID, ensure your system meets the following requirements:

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| **Operating System** | macOS 12+ or Linux (Ubuntu 20.04+) | macOS 14+ or Ubuntu 22.04+ |
| **RAM** | 4 GB | 8 GB+ |
| **Storage** | 5 GB free | 20 GB+ for data retention |
| **Python** | 3.10 | 3.11+ |
| **Node.js** | 20.x LTS | 20.x LTS |
| **GPU** | Not required | Apple Silicon or CUDA for faster AI |
| **Internet** | Required for AI APIs and news sources | Broadband recommended |

> **Note:** RID runs entirely on your local machine. No data leaves your system unless you configure external AI providers or cloud-based data sources.

### 1.2 Installation

RID consists of two components: a **backend** (Python) and a **frontend** (Node.js). Follow the steps below to get everything running.

#### Step 1: Clone the Repository

```bash
git clone https://github.com/james-mtsoln/solo-research-intelligent-agent.git
cd rid
```

#### Step 2: Install the Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Linux/macOS
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

The backend will start on `http://localhost:8000`.

#### Step 3: Install the Frontend

Open a new terminal window:

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on `http://localhost:5173`.

#### Step 4: Verify Installation

Open your web browser and navigate to:

```
http://localhost:5173
```

You should see the RID login screen with the dark theme and "RID" logo.

> **Tip:** Keep both the backend and frontend terminals running while using RID. You can use a terminal multiplexer like `tmux` or a process manager like `pm2` to run them in the background.

### 1.3 First Login

RID comes with a default administrator account for initial setup.

| Field | Value |
|-------|-------|
| **Email** | `admin@local` |
| **Password** | `admin` |

**To log in for the first time:**

1. Open RID in your browser (`http://localhost:5173`)
2. Enter `admin@local` in the **Email** field
3. Enter `admin` in the **Password** field
4. Click **Sign In**

> **Important:** The default password is publicly known. You **must** change it immediately after your first login to protect your account.

### 1.4 Changing Your Default Password

Follow these steps to secure your account:

1. After logging in, click your **profile icon** in the top-right corner
2. Select **Settings** from the dropdown menu
3. Navigate to the **Profile** or **Security** section
4. Enter your current password (`admin`)
5. Enter a new, strong password (at least 8 characters with letters and numbers)
6. Confirm the new password
7. Click **Save Changes**

> **Tip:** Use a password manager to generate and store a strong, unique password for your RID account.

### 1.5 Setting Up Your First AI Provider

RID works best when connected to an AI model. For local, private usage, we recommend **Ollama** — it's free, runs on your machine, and keeps all data local.

#### Quick Setup: Ollama (Recommended)

1. **Install Ollama** — Visit [ollama.com](https://ollama.com) and download the installer for your operating system
2. **Pull a model** — Open a terminal and run:
   ```bash
   ollama pull llama3.2
   ```
3. **Verify Ollama is running**:
   ```bash
   ollama list
   ```
   You should see `llama3.2` in the list.
4. **Configure RID** — Go to **Settings > AI Model** in RID
5. Select **Ollama** from the provider dropdown
6. Ensure the URL is set to `http://localhost:11434`
7. Select **llama3.2** from the model list
8. Click **Test Connection** to verify
9. Click **Save**

> **Note:** Ollama must be running on your machine for RID to use it. Start it with the `ollama serve` command or let it launch automatically.

---

## 2. Dashboard Overview

The Dashboard is your home screen in RID — a single glance at everything happening across your research projects.

### 2.1 Stats Bar

At the top of the Dashboard, you'll find four key metrics displayed as numbered cards:

| Stat | Description |
|------|-------------|
| **Active Plans** | Number of weekly plans currently in progress |
| **Articles This Week** | Total articles collected in the current calendar week |
| **AI Analyses** | Number of AI-powered analyses completed |
| **Pending Reviews** | Items requiring your attention or approval |

These numbers update automatically as your agents work in the background.

### 2.2 Weekly Plans Quick View

Below the stats bar, you'll see a horizontally scrollable row of cards representing your current weekly plans. Each card displays:

- Plan name
- Week number (1–52)
- Status badge (Active / Planned / Completed)
- Article count

**To scroll:** Use your mouse wheel or click and drag horizontally.

### 2.3 Recent Activity Feed

The right side of the Dashboard shows a chronological feed of recent actions, including:

- Articles collected
- Analyses completed
- Plans created or updated
- Agent activities

This gives you a real-time view of what's happening without navigating to individual pages.

### 2.4 Quick Actions

Three prominent buttons at the top-right let you:

- **Create Plan** — Start a new weekly plan
- **Run Analysis** — Trigger AI analysis on a topic or plan
- **Export Report** — Download a summary report

### 2.5 Navigation Bar

The top navigation bar is visible on all pages and contains:

- **RID logo** — Click to return to the Dashboard
- **Navigation links** — Dashboard, Topics, Weekly Plans, Agents, Settings
- **Language switcher** — EN / 简 / 繁 / 日 / 한 / ไทย
- **Notifications bell** — Alerts and updates
- **User dropdown** — Profile, Settings, Logout

---

## 3. Working with Topics

Topics are the foundation of your research in RID. They represent ongoing research areas that persist over time — such as "AI in Healthcare," "Electric Vehicle Market," or "Semiconductor Supply Chain."

> **Tip:** Think of Topics as your long-term research interests. They continuously collect and organize relevant information.

### 3.1 Creating a Research Topic

1. Click **Topics** in the top navigation bar
2. Click the **Create Topic** button (top-right corner)
3. Fill in the topic details:
   - **Name** — A clear, descriptive title (e.g., "AI Drug Discovery")
   - **Description** — What this topic covers and why it matters
   - **Category** — Select from:
     - Technology
     - Finance
     - Healthcare
     - Energy
     - Other
   - **Keywords** — Comma-separated terms that help agents find relevant content (e.g., "machine learning, pharmaceuticals, clinical trials")
   - **Data Sources** — Select where to gather articles from (RSS feeds, NewsAPI, web scraping)
4. Click **Save**

Your new topic will appear on the Topics list page, and agents will begin gathering content immediately.

### 3.2 Setting Up Data Sources for a Topic

When creating or editing a topic, you can configure which data sources to use:

- **RSS Feeds** — Add specific RSS feed URLs relevant to your topic
- **NewsAPI** — Use keyword-based searches across global news outlets
- **Web Scraping** — Monitor specific websites for updates

> **Note:** To use NewsAPI, you must first configure your API key in **Settings > Data Sources**. See Section 7 for details.

### 3.3 Viewing Gathered News

1. From the **Topics** list, click on any topic name
2. You'll land on the **News Feed** tab (see Section 5.1 for details)
3. Articles are displayed in reverse chronological order (newest first)
4. Each article shows:
   - Title with link to original source
   - Source website name
   - Publication date and time
   - AI-generated summary
   - Sentiment indicator (positive / neutral / negative)

### 3.4 Understanding Sentiment Indicators

Each article is tagged with a sentiment score:

| Indicator | Meaning |
|-----------|---------|
| **Positive** | Article conveys optimistic outlook |
| **Neutral** | Factual reporting without bias |
| **Negative** | Article conveys concerns or risks |

The overall topic sentiment is calculated from all collected articles and displayed on the topic card.

### 3.5 Best Practices for Topic Organization

- **Be specific** — "AI in Drug Discovery" is better than "AI"
- **Use 5–10 keywords** — Enough to capture relevant content, not so many that noise creeps in
- **Review weekly** — Check your topic feeds regularly and refine keywords as needed
- **Group by category** — Use categories to keep related topics organized
- **Archive inactive topics** — If a topic is no longer relevant, consider deleting it or noting it as inactive

---

## 4. Working with Weekly Plans

Weekly Plans are time-bound planning cycles that help you organize research around specific business objectives. They're tied to week numbers (1–52) and follow a clear lifecycle.

### 4.1 Creating a Weekly Plan

1. Click **Weekly Plans** in the top navigation bar
2. Click the **Create Plan** button
3. Fill in the plan details:
   - **Name** — A descriptive title (e.g., "Q1 Market Entry Analysis")
   - **Description** — The goal and scope of this week's plan
   - **Week Number** — Select from 1 to 52
   - **Data Sources** — Choose which sources to pull from
4. Click **Save**

The new plan will appear on your Weekly Plans list with a "Planned" status.

### 4.2 Understanding the Planning Cycle

Weekly Plans move through three statuses:

| Status | Description |
|--------|-------------|
| **Planned** | Plan is created but not yet active |
| **Active** | Plan is currently running; agents are gathering and analyzing data |
| **Completed** | Plan has finished its cycle; all analyses are complete |

> **Tip:** Only plans with "Active" status consume agent resources. Keep your active plans focused on current priorities.

### 4.3 Tracking Progress Through the Week

Open any active plan to view its three tabs (see Section 5 for full details):

1. **News Feed** — Articles collected this week
2. **AI Analysis** — Generated insights and trends
3. **Business Plan** — Strategic document with timeline and milestones

Use the article count and analysis status to gauge progress. The AI Analysis tab will show a timestamp of when the last analysis was run.

### 4.4 Reviewing and Completing Plans

At the end of the week:

1. Open the plan and review all three tabs
2. Check that the AI analysis covers your key questions
3. Review the business plan and timeline
4. Click **Mark as Completed** to finalize the plan
5. Export a report if needed for stakeholders

Completed plans remain accessible for reference but won't trigger new agent activity.

### 4.5 Filtering and Sorting Plans

The Weekly Plans page includes controls to help you find what you need:

- **Filter by Status** — Show only Active, Planned, or Completed
- **Sort by** — Name, Date Created, or Article Count
- **Search** — Find plans by keyword in the name or description

---

## 5. Understanding AI Analysis

The heart of RID is its AI-powered analysis engine. Every plan and topic has a detail page with three tabs that transform raw news into actionable intelligence.

### 5.1 News Feed Tab

The News Feed is where all collected articles appear. Here's how it works:

**Data Sources**

Articles are gathered from three sources:

- **RSS Feeds** — Direct subscriptions to news sites and blogs
- **NewsAPI** — Global news aggregation with keyword filtering
- **Web Scraping** — Monitored websites for updates

**Deduplication**

RID automatically detects and removes duplicate articles that appear across multiple sources. You'll only see each story once, with the earliest source preserved.

**AI Summaries**

Each article includes an AI-generated summary that captures:

- Key points and main message
- Relevant entities (companies, people, products)
- Sentiment classification

> **Tip:** Summaries save time — you can scan dozens of articles quickly and click through only the most relevant ones.

**Searching and Filtering**

- **Search bar** — Find articles by keyword in the title or summary
- **Source filter** — Show only articles from a specific source
- **Date filter** — Narrow to a specific date range
- **Sentiment filter** — Show only positive, neutral, or negative articles

### 5.2 AI Analysis Tab

This tab presents a comprehensive AI-generated intelligence report with five sections:

#### Executive Summary

A top-level overview written in natural language, summarizing:

- Key developments this week
- Major shifts or breaking news
- Overall market direction

#### Market Trends

An analysis of patterns and movements across the collected articles, including:

- Emerging trends
- Trending technologies or companies
- Market momentum indicators

#### Competitor Activity Table

A structured table showing:

| Column | Description |
|--------|-------------|
| **Company** | Competitor name |
| **Activity** | What they did (launch, partnership, acquisition) |
| **Impact** | Assessment of strategic significance |
| **Date** | When the activity occurred |

#### Risk Assessment

Identified risks and concerns, categorized by:

- **Severity** — High / Medium / Low
- **Category** — Financial, Operational, Regulatory, Market
- **Description** — What the risk is and why it matters
- **Mitigation** — Suggested actions to address the risk

#### Strategic Opportunities

Actionable opportunities identified from the data, including:

- Market gaps
- Partnership possibilities
- Investment signals

#### Sentiment Donut Chart

A visual representation of overall sentiment distribution:

- **Green slice** — Positive articles (%)
- **Gray slice** — Neutral articles (%)
- **Red slice** — Negative articles (%)

Hover over each slice to see the exact count and percentage.

### 5.3 Business Plan Tab

The Business Plan tab generates a strategic planning document with three components:

#### Strategic Overview

A high-level narrative covering:

- Current market position
- Key objectives
- Strategic priorities

#### 6-Month Timeline

A vertical timeline showing milestones over the next six months:

| Element | Description |
|---------|-------------|
| **Month markers** | Vertical line with month labels |
| **Milestones** — Dots on the timeline with descriptions |
| **Deliverables** — Specific outputs expected at each stage |

> **Tip:** The timeline is AI-generated based on current news trends. Use it as a starting point and adjust to match your actual business calendar.

#### Deliverables Checklist

A list of actionable items with checkboxes:

- Research deliverables
- Analysis reports
- Decision points
- Communication milestones

#### Risk & Mitigation Table

A structured table for risk management:

| Column | Description |
|--------|-------------|
| **Risk** | Identified risk |
| **Likelihood** — High / Medium / Low |
| **Impact** — High / Medium / Low |
| **Mitigation** — Specific action to reduce or eliminate the risk |

---

## 6. Configuring AI Providers

RID supports five AI providers. Choose the one that best fits your privacy, cost, and quality needs.

### 6.1 Ollama (Local — Recommended for Privacy)

Ollama runs AI models directly on your machine. It's **free**, **private**, and works without an internet connection after setup.

**Installation:**

1. Visit [ollama.com](https://ollama.com/download)
2. Download and install for macOS or Linux
3. Open a terminal and pull a model:
   ```bash
   ollama pull llama3.2
   ```

**Verification:**

```bash
ollama list
# Should show: llama3.2
```

**RID Configuration:**

1. Go to **Settings > AI Model**
2. Select **Ollama** from the provider dropdown
3. URL: `http://localhost:11434` (default)
4. Model: Select `llama3.2` from the list
5. Click **Test Connection**
6. Click **Save**

> **Tip:** For better performance on Apple Silicon Macs, use models optimized for Metal (M1/M2/M3). For older machines, smaller models like `phi3` may run faster.

### 6.2 OpenAI

OpenAI provides state-of-the-art models including GPT-4o and GPT-3.5 Turbo.

**Getting an API Key:**

1. Visit [platform.openai.com](https://platform.openai.com)
2. Sign up or log in
3. Go to **API Keys** in the left sidebar
4. Click **Create new secret key**
5. Copy the key (you won't see it again!)

**RID Configuration:**

1. Go to **Settings > AI Model**
2. Select **OpenAI** from the provider dropdown
3. Paste your API key
4. Select your preferred model (GPT-4o recommended, GPT-3.5 Turbo for cost savings)
5. Click **Test Connection**
6. Click **Save**

> **Note:** OpenAI usage is billed per token. Monitor your usage at platform.openai.com to manage costs.

### 6.3 Anthropic (Claude)

Anthropic's Claude models excel at long-form analysis and reasoning.

**Getting an API Key:**

1. Visit [console.anthropic.com](https://console.anthropic.com)
2. Sign up or log in
3. Navigate to **API Keys**
4. Click **Create Key**
5. Copy the key

**RID Configuration:**

1. Go to **Settings > AI Model**
2. Select **Anthropic** from the provider dropdown
3. Paste your API key
4. Select your model (Claude 3.5 Sonnet recommended)
5. Click **Test Connection**
6. Click **Save**

### 6.4 Kimi (Moonshot AI)

Kimi is a powerful model from Moonshot AI with strong multilingual capabilities.

**Getting an API Key:**

1. Visit [platform.moonshot.cn](https://platform.moonshot.cn)
2. Sign up for an account
3. Go to the API Keys section
4. Generate a new key
5. Copy the key

**RID Configuration:**

1. Go to **Settings > AI Model**
2. Select **Kimi** from the provider dropdown
3. Paste your API key
4. Click **Test Connection**
5. Click **Save**

### 6.5 Gemini (Google)

Google's Gemini models offer strong integration with Google services and competitive pricing.

**Getting an API Key:**

1. Visit [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy the key

**RID Configuration:**

1. Go to **Settings > AI Model**
2. Select **Gemini** from the provider dropdown
3. Paste your API key
4. Click **Test Connection**
5. Click **Save**

### 6.6 Provider Comparison

| Provider | Cost | Privacy | Speed | Best For |
|----------|------|---------|-------|----------|
| **Ollama** | Free | Maximum (local) | Depends on hardware | Privacy-sensitive teams |
| **OpenAI** | Pay-per-use | Data sent to OpenAI | Fast | Best overall quality |
| **Anthropic** | Pay-per-use | Data sent to Anthropic | Fast | Long-form analysis |
| **Kimi** | Pay-per-use | Data sent to Moonshot | Fast | Chinese language content |
| **Gemini** | Pay-per-use | Data sent to Google | Fast | Google ecosystem users |

---

## 7. Managing Data Sources

Data sources determine where RID gathers news and information. You can configure them in **Settings > Data Sources**.

### 7.1 RSS Feeds

RSS feeds are the most reliable source of news. They provide structured, timely updates from websites you trust.

**Adding an RSS Feed:**

1. Go to **Settings > Data Sources**
2. Find the **RSS Feeds** section
3. Click **Add Feed**
4. Enter the feed URL (e.g., `https://example.com/feed.xml`)
5. Optionally, add a friendly name
6. Click **Save**

**Finding RSS Feeds:**

- Most news sites have an RSS feed — look for the RSS icon or check `/feed` or `/rss`
- Use an RSS feed directory like [Feedly](https://feedly.com) to discover sources
- Many blogs and industry publications offer category-specific feeds

> **Tip:** Prioritize quality over quantity. 10–15 high-quality feeds will give better results than 100 low-quality ones.

### 7.2 NewsAPI

NewsAPI aggregates articles from thousands of global news sources using keyword search.

**Getting a NewsAPI Key:**

1. Visit [newsapi.org](https://newsapi.org)
2. Sign up for a free or paid account
3. Copy your API key from the dashboard

**Configuring in RID:**

1. Go to **Settings > Data Sources**
2. Find the **NewsAPI** section
3. Paste your API key
4. Click **Test Connection** to verify
5. Click **Save**

> **Note:** The free tier has rate limits. For heavy usage, consider a paid plan.

### 7.3 Web Scraping

Web scraping monitors specific websites for changes and new content.

**Adding a Scraping Target:**

1. Go to **Settings > Data Sources**
2. Find the **Web Scraping** section
3. Click **Add Domain**
4. Enter the website URL (e.g., `https://example.com`)
5. Set the check frequency (hourly, daily)
6. Click **Save**

> **Important:** Only scrape websites you have permission to monitor. Respect robots.txt and terms of service. Some sites may block automated access.

---

## 8. Team Collaboration

RID supports multi-user teams with role-based access control. This section is primarily for **Admin** users who manage team access.

### 8.1 Understanding Roles

RID has three user roles:

| Role | Permissions |
|------|------------|
| **Admin** | Full access: invite users, manage roles, configure all settings, create and edit all content |
| **Editor** | Can create and edit topics and plans, run analyses, configure data sources, but cannot manage users or system settings |
| **Viewer** | Read-only access: can view all data, dashboards, and reports, but cannot create, edit, or delete anything |

> **Tip:** Start new team members as Viewers, then promote to Editors once they're familiar with the platform. Keep Admin roles limited to 1–2 people.

### 8.2 Inviting Team Members

**To invite a new user:**

1. Click **Team** in the top navigation (Admin only)
2. Click **Invite User**
3. Enter the team member's **email address**
4. Select their **role** (Admin / Editor / Viewer)
5. Click **Send Invitation**

The invitee will receive an email with a link to join. They'll need to create a password on first login.

> **Note:** If the invitation email doesn't arrive, check spam folders or click **Resend** next to the pending invitation.

### 8.3 Managing Existing Users

From the Team page, Admins can:

- **Change roles** — Click the role dropdown next to a user
- **Deactivate** — Temporarily disable access without deleting the account
- **Remove** — Permanently delete a user (this cannot be undone)

### 8.4 Managing Pending Invitations

The Team page shows all pending invitations with options to:

- **Resend** — Send the invitation email again
- **Cancel** — Revoke the invitation

> **Tip:** Invitations expire after 7 days. Resend if the invitee hasn't responded.

### 8.5 Security Best Practices

- **Limit Admin roles** — Only 1–2 people should be Admins
- **Use strong passwords** — Require all team members to use strong, unique passwords
- **Regular audits** — Review the user list monthly and remove inactive accounts
- **Principle of least privilege** — Give users the minimum role they need

---

## 9. Settings & Preferences

The Settings page is where you configure RID to match your workflow. Access it from the user dropdown in the top-right corner.

### 9.1 AI Model Settings

Choose and configure your AI provider. See [Section 6: Configuring AI Providers](#6-configuring-ai-providers) for detailed instructions.

- **Provider** — Select from 5 supported providers
- **API Key** — Enter your key securely
- **Model** — Choose the specific model to use
- **Test Connection** — Verify everything works before saving

### 9.2 Data Source Settings

Manage where RID gets its information. See [Section 7: Managing Data Sources](#7-managing-data-sources) for details.

- **RSS Feeds** — Add, edit, remove feeds
- **NewsAPI** — Configure your API key
- **Web Scraping** — Manage monitored domains

### 9.3 API Keys

A centralized, secure storage location for all your service credentials.

> **Important:** All API keys are stored locally on your machine. They are never sent to any external server except the one they belong to (e.g., your OpenAI key is only sent to OpenAI's API).

### 9.4 General Settings

| Setting | Options | Description |
|---------|---------|-------------|
| **Theme** | Dark (default) | RID uses a dark theme optimized for extended reading |
| **Density** | Compact / Normal / Comfortable | Controls spacing between elements |
| **Notifications** | On / Off | Enable or disable in-app notifications |
| **Data Retention** | 30 / 60 / 90 / 180 days | How long to keep articles and analyses |
| **Storage Usage** | Display only | Shows current disk usage |

### 9.5 Data Management

- **Export Data** — Download all your data as a JSON file for backup or migration
- **Clear Data** — Permanently delete all articles, analyses, and plans (cannot be undone)

> **Warning:** Clearing data is permanent. Export a backup first if you might need the data later.

---

## 10. Language Support

RID supports 6 languages. The interface text, date formats, and AI-generated content adapt to your selection.

### 10.1 Supported Languages

| Code | Language |
|------|----------|
| **EN** | English |
| **简** | Chinese (Simplified) |
| **繁** | Chinese (Traditional) |
| **日** | Japanese |
| **한** | Korean |
| **ไทย** | Thai |

### 10.2 Switching Languages

1. Look for the language switcher in the **top navigation bar**
2. Click the current language code (e.g., "EN")
3. Select your preferred language from the dropdown
4. The interface will refresh with all text in the selected language

> **Note:** Language selection is saved per user and persists across sessions. Each team member can use RID in their preferred language.

### 10.3 AI Content Language

When you switch languages, AI-generated content (summaries, analyses, business plans) will also be produced in that language. The underlying data sources remain the same — only the analysis output changes.

---

## 11. Mobile Usage

RID is fully responsive and works on mobile devices, tablets, and desktops.

### 11.1 Mobile Layout

On screens smaller than 768px wide:

- The sidebar navigation is hidden by default
- A **hamburger menu** (three horizontal lines) appears in the top-left corner
- Tapping the hamburger opens a **slide-in drawer** with all navigation links
- The top bar remains visible with the logo, language switcher, and user dropdown
- Cards stack vertically for easy scrolling
- Tables become horizontally scrollable

### 11.2 Mobile Gestures

- **Swipe left/right** on the Weekly Plans cards to scroll horizontally
- **Pull down** on lists to refresh (if supported by your browser)
- **Tap and hold** on articles to see quick actions

### 11.3 Best Practices for Mobile

- Use landscape mode for wider tables and charts
- Pinch to zoom on the sentiment donut chart for detail
- The mobile experience is optimized for consuming content — complex setup tasks are best done on desktop

---

## 12. Troubleshooting

This section covers common issues and their solutions.

### 12.1 Cannot Connect to Ollama

**Problem:** RID shows "Connection failed" when testing Ollama.

**Solutions:**

1. Verify Ollama is running:
   ```bash
   ollama list
   ```
2. If not running, start it:
   ```bash
   ollama serve
   ```
3. Check the URL in Settings — it should be `http://localhost:11434`
4. Ensure no firewall is blocking port 11434
5. Try pulling the model again:
   ```bash
   ollama pull llama3.2
   ```

> **Tip:** On macOS, Ollama runs as a background app. Check the menu bar icon to confirm it's active.

### 12.2 No Articles Appearing

**Problem:** A topic or plan shows zero articles.

**Solutions:**

1. **Check data sources** — Go to Settings > Data Sources and verify feeds/APIs are configured
2. **Verify keywords** — Ensure your topic keywords are spelled correctly and are relevant
3. **Wait for agents** — Articles may take 5–15 minutes to appear after creating a topic
4. **Check agent status** — Go to Agents and ensure News Gatherer is enabled
5. **Test NewsAPI** — If using NewsAPI, click Test Connection in Settings
6. **Check filters** — You may have active filters hiding the articles

### 12.3 Analysis Not Generating

**Problem:** The AI Analysis tab shows "No analysis available."

**Solutions:**

1. **Ensure articles exist** — Analysis requires at least a few articles to work with
2. **Check AI provider** — Verify your AI provider is connected in Settings > AI Model
3. **Run analysis manually** — Click the **Run Analysis** button on the plan/topic page
4. **Check API key** — Ensure your API key is valid and has available quota
5. **Try a different model** — Some models may be temporarily unavailable

### 12.4 Login Issues

**Problem:** Cannot log in or "Invalid credentials" error.

**Solutions:**

1. **Check email format** — Ensure you're using the full email (e.g., `admin@local`)
2. **Password case** — Passwords are case-sensitive
3. **Caps Lock** — Check if Caps Lock is on
4. **Clear browser cache** — Try clearing cookies and cache for localhost
5. **Restart backend** — The database may need reinitialization

### 12.5 Language Not Switching

**Problem:** Interface doesn't change when selecting a different language.

**Solutions:**

1. **Refresh the page** — A full page reload may be needed
2. **Check browser** — Ensure JavaScript is enabled
3. **Clear cache** — Browser cache may be storing old translations
4. **Check backend** — Ensure the backend server is running

### 12.6 Agent Not Working

**Problem:** An agent shows as enabled but isn't producing results.

**Solutions:**

1. **Check dependencies** — Some agents require specific AI providers
2. **Review activity log** — Go to Agents > Activity Log for error messages
3. **Re-enable** — Toggle the agent off and back on
4. **Restart backend** — Agent processes may need a fresh start

---

## 13. Tips & Best Practices

### 13.1 Getting the Most Out of RID

- **Start with 2–3 topics** — Don't overwhelm yourself; focus on key research areas
- **Review weekly** — Schedule 30 minutes each week to review plans and analyses
- **Refine keywords monthly** — Adjust topic keywords based on the articles you're seeing
- **Use AI analysis as a starting point** — Always review and validate AI-generated insights
- **Export reports for stakeholders** — The Export function creates clean, shareable summaries
- **Keep agents focused** — Disable agents you don't need to save processing time

### 13.2 Topic Organization

- Group related topics under the same category
- Use descriptive names that your whole team understands
- Archive completed or irrelevant topics to keep the list clean

### 13.3 Plan Management

- Create plans at the start of each week
- Mark plans as completed to maintain a clean dashboard
- Use consistent naming conventions (e.g., "Week 12 — Market Analysis")

### 13.4 AI Provider Strategy

- Use **Ollama** for daily, privacy-sensitive work
- Use **OpenAI or Anthropic** when you need the highest quality analysis
- Switch providers based on the task — you can change anytime in Settings

### 13.5 Team Collaboration

- Assign Viewers to executives who need visibility
- Editors should be your core research team
- Reserve Admin for IT managers and team leads

---

## 14. Keyboard Shortcuts

RID supports the following keyboard shortcuts for power users:

| Shortcut | Action |
|----------|--------|
| `Ctrl + K` | Open search / command palette |
| `Ctrl + /` | Focus search bar on current page |
| `Esc` | Close modals, dropdowns, and menus |
| `Ctrl + B` | Toggle sidebar (desktop) |
| `Ctrl + Shift + N` | Create new topic |
| `Ctrl + Shift + P` | Create new plan |
| `Ctrl + Shift + A` | Run analysis |
| `Ctrl + ,` | Open Settings |
| `Ctrl + L` | Open language switcher |
| `?` | Show keyboard shortcut help |

> **Note:** On macOS, use `Cmd` instead of `Ctrl` for all shortcuts.

---

## 15. Frequently Asked Questions

### General Questions

**Q: Is RID really private?**  
A: Yes — when using Ollama, all data stays on your local machine. No data is sent to external servers unless you configure an external AI provider or data source.

**Q: Can I use RID on Windows?**  
A: RID is officially supported on macOS and Linux. Windows users can run it via WSL2 (Windows Subsystem for Linux).

**Q: How much does RID cost?**  
A: RID itself is free to use. You only pay for external AI providers (OpenAI, Anthropic, etc.) if you choose to use them instead of the free, local Ollama option.

**Q: Can I access RID from another computer on my network?**  
A: By default, RID runs on localhost. To access from another device, configure the backend to bind to `0.0.0.0` and ensure your firewall allows the connection.

### Data & Analysis

**Q: How often do agents collect new articles?**  
A: Agents check data sources every 15–30 minutes by default. You can adjust this frequency in Settings.

**Q: Can I export my data?**  
A: Yes — go to Settings > General and click **Export Data** to download a JSON backup of all your topics, plans, and analyses.

**Q: How accurate is the AI analysis?**  
A: AI analysis is a powerful starting point but should be reviewed by humans. It may occasionally miss nuances or make incorrect inferences. Always validate critical decisions.

**Q: What happens to my data if I stop using RID?**  
A: All data is stored locally on your machine. You can export it anytime or simply delete the application folder.

### Technical Questions

**Q: Do I need a GPU?**  
A: No — RID works fine on CPU-only systems. A GPU (Apple Silicon or NVIDIA CUDA) will make AI analysis faster.

**Q: Can I run RID without internet?**  
A: Partially — if using Ollama, the core functionality works offline. However, news gathering requires internet access.

**Q: How do I update RID?**  
A: Pull the latest code from the repository and restart the backend and frontend:
```bash
git pull
# Restart both backend and frontend services
```

**Q: Where is my data stored?**  
A: All data is stored in a local SQLite database in the `backend/` directory. You can back up this file directly.

### Team & Security

**Q: How many users can I invite?**  
A: There is no hard limit. The practical limit depends on your server's hardware resources.

**Q: Can I restrict a user to only see certain topics?**  
A: Currently, RID uses role-based access (Admin/Editor/Viewer) without per-topic restrictions. This may be added in a future update.

**Q: Is my API key secure?**  
A: Yes — API keys are stored in your local database and are only sent to their respective services (e.g., your OpenAI key is only sent to OpenAI).

---

## 16. Glossary

| Term | Definition |
|------|------------|
| **Agent** | An AI-powered worker that performs specific tasks like gathering news, analyzing trends, or generating business plans. RID comes with 5 built-in agents. |
| **AI Analysis** | A comprehensive report generated by AI that includes executive summaries, market trends, competitor activity, risk assessments, and strategic opportunities. |
| **Business Plan** | A strategic planning document generated by AI that includes an overview, 6-month timeline with milestones, deliverables checklist, and risk mitigation table. |
| **Category** | A classification for topics: Technology, Finance, Healthcare, Energy, or Other. Used to organize research areas. |
| **Data Source** | A channel where RID collects information: RSS feeds, NewsAPI, or web scraping targets. |
| **Donut Chart** | A circular visualization showing the distribution of sentiment (positive, neutral, negative) across collected articles. |
| **Editor** | A user role that can create, edit, and manage topics, plans, and analyses, but cannot manage users or system settings. |
| **Keyword** | A term or phrase used to filter and find relevant articles. Keywords are defined per topic. |
| **Milestone** | A significant event or deadline on the 6-month business plan timeline. |
| **News Feed** | A tab showing all articles collected for a topic or plan, with AI summaries and filtering options. |
| **Ollama** | A free, open-source tool for running AI models locally on your machine. Recommended for privacy. |
| **Pipeline** | The sequence of steps an agent follows to process data: collect, filter, summarize, analyze, report. |
| **Plugin** | An extension that adds new functionality to RID. Plugins can be browsed and installed from the agent catalog. |
| **RSS Feed** | A web feed that allows websites to distribute content in a standardized format. RID can subscribe to RSS feeds for automated news collection. |
| **Sentiment** | The emotional tone of an article: positive, neutral, or negative. Calculated automatically by AI. |
| **Topic** | A persistent research area in RID. Topics are long-running and continuously collect relevant articles. |
| **Viewer** | A user role with read-only access. Viewers can see all data but cannot create or modify anything. |
| **Weekly Plan** | A time-bound research cycle organized by week number (1–52). Plans have a defined start and end and produce a complete analysis package. |
| **Web Scraping** | Automated monitoring of websites to detect new content and changes. |

---

## Support & Resources

- **Live Demo:** [https://www.mtsoln.com/rid](https://www.mtsoln.com/rid)
- **Documentation:** This manual covers all RID features
- **Issue Tracker:** Report bugs and request features through your organization's RID repository

---

*Thank you for using Research Intelligence Dashboard. We hope RID helps your team make smarter, faster decisions.*

*© 2025 RID Team. All rights reserved.*
