import RequireAuth from "@/components/RequireAuth";
import Header from "@/components/Header";
import ChatWidget from "@/components/ChatWidget";

export default function ChatPage() {
  return (
    <RequireAuth>
      <main>
        <Header />
        <ChatWidget />
      </main>
    </RequireAuth>
  );
}
