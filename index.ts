const THEMES = [
    { target: "チョコレート", forbidden: ["甘い", "お菓子", "茶色", "カカオ"] },
    { target: "りんご", forbidden: ["果物", "赤い", "フルーツ", "アップル"] },
    { target: "野球", forbidden: ["スポーツ", "ボール", "バット", "選手"] },
    { target: "寿司", forbidden: ["日本食", "魚", "米", "わさび"] },
    { target: "コーヒー", forbidden: ["飲む", "豆", "カフェ", "黒い"] },
    { target: "自転車", forbidden: ["乗る", "車輪", "ペダル", "交通"] },
    { target: "スマートフォン", forbidden: ["電話", "アプリ", "画面", "携帯"] },
    { target: "犬", forbidden: ["ペット", "動物", "鳴く", "散歩"] },
    { target: "猫", forbidden: ["ペット", "動物", "鳴く", "可愛い"] },
    { target: "本", forbidden: ["読む", "紙", "文字", "図書館"] },
    { target: "テレビ", forbidden: ["見る", "番組", "映像", "放送"] },
    { target: "ラーメン", forbidden: ["麺", "スープ", "食べる", "中華"] },
    { target: "海", forbidden: ["水", "青い", "泳ぐ", "塩"] },
    { target: "空", forbidden: ["青い", "雲", "飛ぶ", "天気"] },
    { target: "学校", forbidden: ["勉強", "生徒", "先生", "授業"] },
    { target: "病院", forbidden: ["医者", "看護師", "病気", "治療"] },
    { target: "夏", forbidden: ["季節", "暑い", "休み", "太陽"] },
    {
        target: "AI",
        forbidden: ["人工知能", "コンピュータ", "プログラム", "ロボット"],
    },
    { target: "宇宙", forbidden: ["星", "ロケット", "地球", "銀河"] },
    { target: "忍者", forbidden: ["隠れる", "刀", "手裏剣", "日本"] },
];

// --- グローバル変数 ---
import OpenAI from "jsr:@openai/openai";
const client = new OpenAI({
    baseURL: "http://localhost:11434/v1",
    apiKey: "llama.cpp",
});
let isGameOver = true;
let turnCount = 0;
let currentTheme: { target: string; forbidden: string[] } = {
    target: "",
    forbidden: [],
};
let chatHistory: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

function resetGame() {
    turnCount = 0;
    isGameOver = false;
    chatHistory = [];

    const theme = THEMES[Math.floor(Math.random() * THEMES.length)];
    currentTheme = {
        ...theme,
        forbidden: [...theme.forbidden, theme.target],
    };

    const systemPrompt =
        "あなたは知識が豊富なAIアシスタントです。ユーザーからの質問や会話に対して、誠実かつ簡潔、自然に日本語で応答してください。";
    chatHistory.push({ role: "system", content: systemPrompt });

    addSystemMessage(
        `お題決定！禁止ワードを使わずに「${currentTheme.target}」と言わせてみよう！`,
    );
    addSystemMessage(
        `禁止ワード:${currentTheme.forbidden.join(",")}`,
    );
}

async function handleSendMessage(message: string) {
    if (message === "" || isGameOver) return;

    const foundForbiddenWord = currentTheme.forbidden.find((word) =>
        message.includes(word)
    );
    if (foundForbiddenWord) {
        alert(`禁止ワード「${foundForbiddenWord}」が含まれています！`);
        return;
    }

    addUserMessage(message);
    chatHistory.push({ role: "user", content: message });
    await generateAIReply();
}

async function generateAIReply() {
    const chunks = await client.chat.completions.create({
        model: Deno.args[0],
        messages: chatHistory,
        stream: true,
        max_tokens: 50,
    });

    let fullResponse = "";
    for await (const chunk of chunks) {
        fullResponse += chunk.choices[0].delta.content;
        await Deno.stdout.write(
            new TextEncoder().encode(chunk.choices[0].delta.content ?? ""),
        );
    }
    await Deno.stdout.write(new Uint8Array([10]));
    chatHistory.push({ role: "assistant", content: fullResponse });
    checkGameStatus(fullResponse);
}

function checkGameStatus(aiResponse: string) {
    turnCount++;
    if (aiResponse.includes(currentTheme.target)) {
        addSystemMessage(
            `🎉 クリア！おめでとうございます！見事に「${currentTheme.target}」と言わせました！`,
        );
        isGameOver = true;
    }
}

function addUserMessage(text: string) {
}

function addSystemMessage(text: string) {
    console.log("Sys: " + text);
}

resetGame();
while (!isGameOver) {
    const userInput = prompt(">");
    if (!userInput) {
        continue;
    }
    await handleSendMessage(userInput);
}
