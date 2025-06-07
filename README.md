# 💕 BondQuest - Voice-First Relationship Platform

<div align="center">

![BondQuest Logo](https://img.shields.io/badge/💕-BondQuest-purple?style=for-the-badge&logoColor=white)
[![Production Ready](https://img.shields.io/badge/Status-Production%20Ready-brightgreen?style=for-the-badge)](https://github.com/TabareMajem/Bondquest)
[![Voice Enabled](https://img.shields.io/badge/🎤-Voice%20First-blue?style=for-the-badge)](https://github.com/TabareMajem/Bondquest)
[![AI Powered](https://img.shields.io/badge/🤖-AI%20Powered-orange?style=for-the-badge)](https://github.com/TabareMajem/Bondquest)

**The revolutionary voice-first relationship platform that brings couples closer together through AI-powered conversations, interactive games, and beautiful design.**

[🎤 Try Voice Demo](#voice-demo) • [📱 View Screenshots](#screenshots) • [🚀 Quick Start](#quick-start) • [🎯 Features](#features)

</div>

---

## 🌟 **What Makes BondQuest Special**

BondQuest is the **first voice-first relationship platform** that combines:
- 🎤 **Revolutionary Voice Onboarding** - Set up your profile by simply talking
- 💎 **Stunning Purple-Themed UI** - Beautiful gradients and smooth animations
- 🎮 **Interactive Quiz Games** - Speed quizzes, memory games, drag & drop challenges
- 🤖 **AI-Powered Insights** - Personalized relationship recommendations
- 📊 **Bond Strength Assessment** - 20+ relationship dimensions analysis
- 💕 **Partner Connection System** - Unique codes to link couples seamlessly

---

## 🎤 **Voice Demo**

Experience the future of relationship apps with our voice-first onboarding:

1. **Start the app**: `npm run dev`
2. **Visit**: http://localhost:5000
3. **Click**: "Start with Voice"
4. **Speak naturally**: "My name is Alex"
5. **Continue through 5 steps** and get your partner code!

**Supported Commands**:
```
Name: "My name is Sarah" / "I'm John"
Status: "We're dating" / "We're married"
Anniversary: "February 14th, 2023"
Love Language: "Quality time" / "Physical touch"
Goals: "Better communication" / "More intimacy"
```

---

## 📱 **Screenshots**

### Beautiful Dashboard
- 💜 Purple gradient backgrounds
- ⭕ Circular bond strength meter (68%)
- 👥 User avatars with gradient borders
- 🎯 Daily quiz cards with START buttons
- 📊 Recent activity feed
- 🔘 Floating action buttons

### Voice Onboarding
- 🎤 Animated microphone with pulse effects
- 📝 Real-time speech-to-text display
- 🗣️ Text-to-speech AI responses
- 📈 Progress tracking through 5 steps
- ✨ Smooth animations and transitions

---

## 🚀 **Quick Start**

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Modern browser (Chrome, Safari, Edge for voice features)

### Installation
```bash
# Clone the repository
git clone https://github.com/TabareMajem/Bondquest.git
cd Bondquest

# Install dependencies
npm install

# Start development server
npm run dev

# Open your browser
open http://localhost:5000
```

### Test Users
- **Alex**: `alex@bondquest.demo` (Partner Code: BOND-ALEX123)
- **James**: `james@bondquest.demo` (Partner Code: BOND-JAMES456)

---

## 🎯 **Features**

### 🎤 **Voice-First Experience**
- **Speech-to-Text**: Real-time voice recognition
- **Text-to-Speech**: AI responds with natural voice
- **Conversational Flow**: 5-step guided onboarding
- **Browser Support**: Chrome, Safari, Edge (graceful fallback for others)
- **Visual Feedback**: Animated UI with voice indicators

### 💎 **Beautiful UI Design**
- **Purple Theme**: Stunning gradients from purple to pink
- **Glassmorphism**: Modern card designs with backdrop blur
- **Smooth Animations**: Framer Motion powered interactions
- **Responsive Design**: Perfect on mobile and desktop
- **Accessibility**: ARIA labels and keyboard navigation

### 🎮 **Interactive Quiz System**
- **Speed Quiz**: Time-pressured questions with decreasing points
- **Memory Match**: Card matching challenges
- **Drag & Drop**: Ordering and arrangement games
- **Reflex Tap**: Quick reaction challenges
- **Standard Quiz**: Traditional multiple choice

### 🤖 **AI-Powered Insights**
- **Relationship Analysis**: 20+ bond dimensions assessment
- **Personalized Recommendations**: AI-generated action items
- **Progress Tracking**: Visual bond strength meter
- **Smart Conversations**: Context-aware AI responses
- **Insight Generation**: Relationship growth suggestions

### 💕 **Partner Connection**
- **Unique Codes**: Secure partner linking (e.g., BOND-ALEX123)
- **Couple Profiles**: Shared relationship dashboard
- **Joint Assessments**: Collaborative bond evaluations
- **Shared Progress**: Combined XP, levels, and achievements
- **Activity Feed**: Recent couple interactions

### 🏆 **Gamification**
- **Points System**: Earn points for completing activities
- **Achievements**: Unlock relationship milestones
- **Levels & XP**: Progress through relationship stages
- **Streaks**: Daily activity tracking
- **Competitions**: Couple challenges and leaderboards

---

## 🛠️ **Tech Stack**

### Frontend
- **React 18** - Modern UI library
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Framer Motion** - Smooth animations
- **Wouter** - Lightweight routing
- **TanStack Query** - Data fetching and caching

### Backend
- **Express.js** - Web application framework
- **TypeScript** - Type-safe server development
- **Drizzle ORM** - Type-safe database operations
- **PostgreSQL** - Production database (optional)
- **In-Memory Storage** - Development mode
- **Session Management** - Secure user sessions

### Voice & AI
- **Web Speech API** - Browser-native speech recognition
- **Speech Synthesis API** - Text-to-speech functionality
- **Gemini AI** - Advanced language model integration
- **Natural Language Processing** - Smart response handling

---

## 📁 **Project Structure**

```
BondQuest/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   │   ├── voice/      # Voice-related components
│   │   │   ├── quiz/       # Quiz game components
│   │   │   └── ui/         # Base UI components
│   │   ├── pages/          # Application pages
│   │   ├── contexts/       # React contexts
│   │   └── hooks/          # Custom React hooks
├── server/                 # Backend Express application
│   ├── auth/              # Authentication strategies
│   ├── routes/            # API route handlers
│   ├── services/          # Business logic services
│   └── storage.ts         # Data storage interface
├── shared/                # Shared types and utilities
│   ├── schema.ts          # Database schema definitions
│   ├── bondDimensions.ts  # Relationship assessment logic
│   └── aiCompanions.ts    # AI conversation helpers
└── docs/                  # Documentation and guides
```

---

## 🧪 **Testing**

### Voice Features
```bash
# Test voice onboarding
open http://localhost:5000/voice-onboarding

# Test dashboard
open http://localhost:5000/dashboard

# Test quiz games
open http://localhost:5000/quiz/1
```

### Browser Compatibility
- ✅ **Chrome**: Full voice features
- ✅ **Safari**: Full voice features
- ✅ **Edge**: Full voice features
- ⚠️ **Firefox**: Graceful fallback to text input

### Mobile Testing
- 📱 **iOS Safari**: Voice features supported
- 📱 **Android Chrome**: Voice features supported
- 📱 **Responsive Design**: Perfect on all screen sizes

---

## 🚀 **Deployment**

### Development
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Environment Variables
```env
# Optional - for production database
DATABASE_URL=postgresql://user:password@host:port/database

# Optional - for AI features
GEMINI_API_KEY=your_gemini_api_key

# Optional - for email features
SMTP_HOST=your_smtp_host
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

---

## 🤝 **Contributing**

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 **Acknowledgments**

- **Voice Technology**: Built with Web Speech API
- **AI Integration**: Powered by Gemini AI
- **Design Inspiration**: Modern relationship apps and voice assistants
- **Community**: Thanks to all contributors and testers

---

## 📞 **Support**

- 📧 **Email**: support@bondquest.app
- 💬 **Discord**: [Join our community](https://discord.gg/bondquest)
- 🐛 **Issues**: [GitHub Issues](https://github.com/TabareMajem/Bondquest/issues)
- 📖 **Documentation**: [Full docs](https://docs.bondquest.app)

---

<div align="center">

**Made with 💕 for couples everywhere**

[![GitHub stars](https://img.shields.io/github/stars/TabareMajem/Bondquest?style=social)](https://github.com/TabareMajem/Bondquest/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/TabareMajem/Bondquest?style=social)](https://github.com/TabareMajem/Bondquest/network/members)
[![GitHub issues](https://img.shields.io/github/issues/TabareMajem/Bondquest)](https://github.com/TabareMajem/Bondquest/issues)

[⭐ Star this repo](https://github.com/TabareMajem/Bondquest) • [🍴 Fork it](https://github.com/TabareMajem/Bondquest/fork) • [📢 Share it](https://twitter.com/intent/tweet?text=Check%20out%20BondQuest%20-%20the%20voice-first%20relationship%20platform!&url=https://github.com/TabareMajem/Bondquest)

</div> 