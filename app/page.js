"use client";
import { useState } from "react";
import { ReactMediaRecorder } from "react-media-recorder";
export default function Home() {

  const [streamedData, setStreamedData] = useState("");
  const [loading, setLoading] = useState(false);
  const [audio, setAudio] = useState(null);

  const handleChatSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    console.log(formData.get('prompt'));

    //const response = await fetch("/api/chat", {
    const response = await fetch("/api/langchain/text", {
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

  const handleAudioUpload = async (blobUrl) => {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    const formData = new FormData();

    formData.append("audio", blob, "audio.webm");

    setLoading(true);
    try {
      const uploadResponse = await fetch("/api/elevanlabs/audio", {
        method: "POST",
        body: formData,
      });
  
      if (!uploadResponse.ok) {
        throw new Error("Something went wrong with audio upload");
      }
  
      const { file } = await uploadResponse.json();
      setAudio(file);
      console.log(data);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }

  }; 

  return (
    <main className="flex max-w-6xl mx-auto items-center justify-center p-24">
      <div className="flex flex-col gap-12">
      <img src="/comp_logo.png" alt="Company Logo"/>
        <h1 className="text-gray-200 font-extrabold text-6xl text-center">
          保険の窓口 
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
        <ReactMediaRecorder
          audio
          render={({ status, startRecording, stopRecording, mediaBlobUrl }) => (
            <div>
              <p>{status}</p>
              <button
                onClick={startRecording}
                className="py-2 px-4 bg-green-800 text-white rounded-lg hover:opacity-80"
              >
                Start Recording
              </button>
              <button
                onClick={stopRecording}
                className="py-2 px-4 bg-yellow-800 text-white rounded-lg hover:opacity-80"
              >
                Stop Recording
              </button>
              {mediaBlobUrl && <audio src={mediaBlobUrl} controls />}
              {status === "stopped" && mediaBlobUrl && (
                <button 
                onClick={() => handleAudioUpload(mediaBlobUrl)}
                className="py-2 px-4 bg-blue-800 text-white rounded-lg hover:opacity-80"
                >
                  Upload Audio
                </button>
              )}
              {audio && <audio autoPlay controls src={`audio/${audio}`} />}
            </div>
          )}
        />       
      </div>
    </main>
  );
}
