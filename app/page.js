"use client";

import { useState } from "react";
export default function Home() {

  const [streamedData, setStreamedData] = useState("こんにちは");

  const handleChatSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    console.log(formData.get('prompt'));

    //const response = await fetch("/api/chat", {
    const response = await fetch("/api/langchain", {
      method: "POST",
      body: JSON.stringify({ prompt : formData.get('prompt') }),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) { 
        break; 
      }
      const text = new TextDecoder().decode(value);
      setStreamedData((preData) => preData + text);
    }
  };

  const handleClearChat =  (e) => {
    setStreamedData("");
  };

  return (
    <main className="flex max-w-6xl mx-auto items-center justify-center p-24">
      <div className="flex flex-col gap-12">
      <img src="/comp_logo.png" alt="Company Logo"/>
        <h1 className="text-gray-200 font-extrabold text-6xl text-center">
          保険の窓口 🦆
        </h1>
        <form onSubmit={handleChatSubmit}>
          <input
            className="py-2 px-4 rounded-md bg-gray-600 text-white w-full"
            placeholder="質問をどうぞ"
            name="prompt"
            required
          ></input>
          <div className="flex justify-center gap-4 py-4">
          <button
            type="submit"
            className="py-2 px-4 rounded-md text-sm bg-blue-900 text-white hover:opacity-80 transition-opacity"
          >
            送信
          </button>
          <button
            type="button"
            onClick={handleClearChat}
            className="py-2 px-4 rounded-md text-sm bg-red-700 text-white hover:opacity-80 transition-opacity"
          >
           クリアする
          </button>
          </div>
        </form>
        {streamedData && (
          <div className="flex flex-col gap-4">
            <h3 className="text-xl text-gray-400">Emma AIアシスタント</h3>
            <p className="text-gray-200 rounded-md bg-gray-700 p-4">{streamedData}</p>
          </div>
          )}
      </div>
    </main>
  );
}
