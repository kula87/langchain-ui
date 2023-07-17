
import multer from 'multer';
import fs from 'fs';
// import { promises as fs } from 'fs';
import path from 'path';
import nc from 'next-connect';
import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanMessage, SystemChatMessage } from "langchain/schema";
import * as dotenv from "dotenv";
import { promisify } from 'util';
import util from 'util';

const ffmpeg = require("fluent-ffmpeg");
const { Configuration, OpenAIApi } = require("openai");
const textToSpeech = require('@google-cloud/text-to-speech');
const upload = multer({ dest: '/tmp' });
const writeFile = promisify(fs.writeFile);

dotenv.config();


const configuration = new Configuration({
  apiKey: "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",
});
const openai = new OpenAIApi(configuration);


export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
};

const model = new ChatOpenAI({
    temperature: 0,
    modelName: "gpt-3.5-turbo",
});

// Creates a client
const client = new textToSpeech.TextToSpeechClient();

// Google Text-to-Speech
// Google Text-to-Speech
async function googleTextToSpeech(text, languageCode = 'ja-JP', voiceName = 'ja-JP-Wavenet-A') {
  // Construct the request
  const request = {
    input: { text: text },
    voice: {
      languageCode: languageCode,
      name: voiceName,
      ssmlGender: 'NEUTRAL'
    },
    audioConfig: { audioEncoding: 'MP3' },
  };

  // Performs the text-to-speech request
  const [response] = await client.synthesizeSpeech(request);
  
  // Write the binary audio content to a local file
  const outputFileName = Math.random().toString(36).substring(7) + ".mp3";
  const outputFilePath = path.join("public", "audio", outputFileName);
  await fs.promises.writeFile(outputFilePath, response.audioContent, 'binary');
  console.log('Audio content written to file:', outputFileName);


  // Return the path to the output file
  return outputFileName;
}


// Transcribe audio
async function transcribeAudio(filename) {
  const transcript = await openai.createTranscription(
    fs.createReadStream(filename),
    "whisper-1"
  );
  return transcript.data.text;
}

export default async function handler(req, res) {
  if(req.method === 'POST'){

    const middleware = upload.single('audio');
    middleware(req, res, (err) => {
      if (err) {
        console.log("Error occurred while handling request:", err);
        res.status(500).json({ error: `Error occurred while handling request: ${err.message}` });
      } else {
        
        const { file } = req;
        const newFileName = Math.random().toString(36).substring(7) + ".webm";
        const newPath = path.join("public", "audio", newFileName);
        const wavPath = path.join("public", "audio", `${newFileName}.wav`);

        fs.rename(file.path, newPath, (err) => {
          if (err) {
            console.error(err);
            res.status(500).end();
          } else {
            // Convert .webm to .wav
            ffmpeg(newPath)
              .toFormat('wav')
              .on('error', (err) => {
                console.log('An error occurred: ' + err.message);
                res.status(500).end();
              })
              .on('end', async () => {
                
                // Here you can call your speech-to-text service with the .wav file
                const transcript = await transcribeAudio(wavPath);

                console.log('Processing ....!', transcript);

                const resModel = await model.generate(
                  [
                    [
                      new SystemChatMessage("高度なスキルを備えた生命保険営業のプロフェッショナルとして、顧客に保険契約を簡潔かつインパクトのある方法で説明する能力が求められます。あなたの専門知識は、保険概念の本質を捉えた効果的で説得力のある説明を提供することにあります。さらに、顧客の一般的な問い合わせを保険に関する魅力的なストーリーにシームレスに誘導することに優れており、それによって顧客の興味を引き付け、補償の重要性をさらに強化します。"),
                      new HumanMessage(transcript),
                    ],      
                  ],
                  { maxTokens: 10 }
                );
                

                console.log("Yatta:", resModel.generations[0][0].text);

                const resFile = await googleTextToSpeech(resModel.generations[0][0].text, 'ja-JP', 'ja-JP-Wavenet-A');

                res.status(200).json({ file: resFile});

              })
              .save(wavPath);
          }          
        });
      }
    });
  } else {
    res.status(405).json({ error: `Method '${req.method}' Not Allowed` });
  }
}