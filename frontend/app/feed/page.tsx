import RequireAuth from "@/components/RequireAuth";
import Header from "@/components/Header";
import Feed from "@/components/Feed";

export default function FeedPage() {
  return (
    <RequireAuth>
      <main>
        <Header />
        <Feed />
      </main>
    </RequireAuth>
  );
}
