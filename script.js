
const textInput = document.getElementById("textInput");
const language = document.getElementById("language");
const status = document.getElementById("status");
const speechOutput = document.getElementById("speechOutput");

// Read text aloud
const languageNames = {
    "en-IN": "en",
    "kn-IN": "kn",
    "hi-IN": "hi",
    "ta-IN": "ta",
    "te-IN": "te",
    "ml-IN": "ml",
    "mr-IN": "mr",
    "bn-IN": "bn",
    "gu-IN": "gu",
    "pa-IN": "pa",
    "ur-IN": "ur",
    "or-IN": "or",
    "as-IN": "as",
    "ne-NP": "ne",
    "en-US": "en",
    "es-ES": "es",
    "fr-FR": "fr",
    "de-DE": "de",
    "ar-SA": "ar",
    "zh-CN": "zh-CN"
};

document.getElementById("readBtn").addEventListener("click", async () => {
    const text = textInput.value.trim();

    if (!text) {
        alert("Please enter some text first.");
        return;
    }

    const targetLang = languageNames[language.value] || "en";

    try {
        status.textContent = "Translating your text...";

        const url =
            "https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=" +
            encodeURIComponent(targetLang) +
            "&dt=t&q=" +
            encodeURIComponent(text);

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Translation failed");
        }

        const data = await response.json();
        const translatedText = data[0]
            .map(part => part[0])
            .join("");

        textInput.value = translatedText;

        const voices = speechSynthesis.getVoices();
        const matchingVoice = voices.find(voice =>
            voice.lang.toLowerCase().startsWith(targetLang.toLowerCase())
        );

        if (!matchingVoice && targetLang !== "en") {
            status.textContent =
                "Translated, but your device may not have a voice for this language.";
        }

        speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(translatedText);
        utterance.lang = targetLang;
        if (matchingVoice) utterance.voice = matchingVoice;
        utterance.rate = 0.9;

        utterance.onstart = () => {
            status.textContent = "Speaking in " + targetLang + "...";
        };

        utterance.onend = () => {
            status.textContent = "Finished reading.";
        };

        utterance.onerror = () => {
            status.textContent =
                "Speech failed. Your device may not support this language.";
        };

        speechSynthesis.speak(utterance);
    } catch (error) {
        status.textContent =
            "Translation failed. Check your internet connection and try again.";
    }
});
// Stop reading
document.getElementById("stopBtn").addEventListener("click", () => {
    if ("speechSynthesis" in window) {
        speechSynthesis.cancel();
    }

    status.textContent = "Reading stopped.";
});

// Voice typing
const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

let recognition;
let isListening = false;
let finalTranscript = "";

if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
        isListening = true;
        status.textContent = "Listening... Please speak.";
        document.getElementById("micBtn").textContent = "Stop Speaking";
    };

    recognition.onresult = (event) => {
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;

            if (event.results[i].isFinal) {
                finalTranscript += transcript + " ";
            } else {
                interimTranscript += transcript;
            }
        }

        speechOutput.textContent =
            (finalTranscript + interimTranscript).trim() ||
            "Listening for your words...";
    };

    recognition.onerror = (event) => {
        status.textContent = "Microphone error: " + event.error;
    };

    recognition.onend = () => {
        isListening = false;
        document.getElementById("micBtn").textContent = "Start Speaking";

        if (status.textContent === "Listening... Please speak.") {
            status.textContent = "Voice typing stopped.";
        }
    };
} else {
    document.getElementById("micBtn").disabled = true;
    status.textContent =
        "Voice typing is not supported in this browser. Try a supported browser.";
}

document.getElementById("micBtn").addEventListener("click", () => {
    if (!recognition) {
        alert("Voice typing is not supported in this browser.");
        return;
    }

    if (isListening) {
        recognition.stop();
        return;
    }

    finalTranscript = "";
    speechOutput.textContent = "Listening for your words...";
    recognition.lang = language.value;

    try {
        recognition.start();
    } catch (error) {
        status.textContent = "Unable to start microphone. Please try again.";
    }
});

// Transfer spoken text into the main text box
document.getElementById("useTextBtn").addEventListener("click", () => {
    const spokenText = speechOutput.textContent.trim();

    if (
        !spokenText ||
        spokenText === "Your spoken words will appear here." ||
        spokenText === "Listening for your words..."
    ) {
        alert("Please speak something first.");
        return;
    }

    textInput.value = spokenText;
    textInput.focus();
    status.textContent = "Spoken text added to the text box.";
});

// Accessibility: increase text size
let fontSize = 18;

document.getElementById("increaseBtn").addEventListener("click", () => {
    fontSize = Math.min(fontSize + 2, 30);
    document.body.style.fontSize = fontSize + "px";
});

// Accessibility: decrease text size
document.getElementById("decreaseBtn").addEventListener("click", () => {
    fontSize = Math.max(fontSize - 2, 14);
    document.body.style.fontSize = fontSize + "px";
});

// High contrast mode
document.getElementById("contrastBtn").addEventListener("click", () => {
    const enabled = document.body.classList.toggle("high-contrast");

    document.getElementById("contrastBtn").textContent =
        enabled ? "Turn Off High Contrast" : "◐ High Contrast";
});