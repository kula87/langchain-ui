import { ChatOpenAI } from "langchain/chat_models/openai";
import { HumanChatMessage,} from "langchain/schema";

const runLLMChain = async (prompt) => {
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const model = new ChatOpenAI({
        streaming: true,
        callbacks:[
            {
                async handleLLMNewToken(token){
                    // process.stdout.write(token);
                    // res.write(token);
                    await writer.ready;
                    await writer.write(encoder.encode(`${token}`));
                },
                async handleLLMEnd(){
                    await writer.ready;
                    await writer.close();
                }
            },
        ],
    });

    model.call([new HumanChatMessage(prompt)]);
    return stream.readable;
};

export async function POST(req, res) {

    const { prompt } = await req.json();

    const stream = await runLLMChain(prompt);

    return new Response(await stream);
}