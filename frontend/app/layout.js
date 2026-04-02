import "./globals.css";
import { LanguageProvider } from "@/contexts/LanguageContext";

export const metadata = {
  title: "QuizMaster Pro - Test Your Knowledge & Win Coins!",
  description:
    "Challenge yourself with fun trivia quizzes, climb the leaderboard, and earn coins. Join thousands of players competing daily!",
  keywords: "quiz, trivia, games, leaderboard, coins, rewards",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
