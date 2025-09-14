"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user?.id) {
      router.push("/login"); // send to login if not logged in
    } else {
      router.push("/buyers"); // or directly to buyers if already logged in
    }
  }, [router]);

  return <div>Loading...</div>;
}
