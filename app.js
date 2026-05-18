/* ==========================================================================
   STARK INDUSTRIES JARWIS v4.5 CORE ENGINE (VOICE RECOGNITION & TTS)
   ========================================================================== */

// DOM Elementlerini Bağlama
const activationCore = document.getElementById('jarwis-activation-core');
const starkCamera = document.getElementById('stark-camera');
const coreStatusMsg = document.getElementById('core-status-msg');
const starkWaveframe = document.getElementById('stark-waveframe');
const jarwisTerminalOutput = document.getElementById('jarwis-terminal-output');
const telemetryTemp = document.getElementById('telemetry-temp');

let isCoreActive = false;
let globalStream = null;
let audioContext = null;
let analyser = null;
let dataArray = null;
let animationFrameId = null;

// SES TANIMA VE KONUŞMA DEĞİŞKENLERİ
let recognition = null;
let isJarwisSpeaking = false;

// Telemetri Simülasyonu (Sıcaklık)
setInterval(() => {
    if (isCoreActive) {
        const randomTemp = (38 + Math.random() * 2).toFixed(1);
        telemetryTemp.innerText = `${randomTemp}°C`;
    }
}, 3000);

/**
 * Ücretsiz ve Kotasız Yapay Zeka Sunucu Bağlantısı
 */
async function talkToJarwisAI(userMessage) {
    try {
        const response = await fetch(`https://openrouter.ai/api/v1/chat/completions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                "model": "meta-llama/llama-3-8b-instruct:free",
                "messages": [
                    {
                        "role": "system", 
                        "content": "Sen JARWIS'sin. Yasin Emre'nin (kurucunun) milyar dolarlık siber asistanısın. Karizmatik, kusursuz derecede zeki, kurucusuna son derece sadık ve hafif mesafeli bir tavrın var. Cevapların siberpunk/bilimkurgu havasında, çok kısa, maksimum 1-2 cümle, net ve etkileyici olmalı. Türkçe konuş."
                    },
                    {"role": "user", "content": userMessage}
                ]
            })
        });
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        return "Sinyal tünellerinde ufak bir parazit var efendim.";
    }
}

/**
 * JARWIS SESLİ KONUŞMA MODÜLÜ (Sistemden Kullanıcıya Ses)
 */
function jarwisSpeak(text) {
    if (!('speechSynthesis' in window)) return;

    // JARWIS konuşurken kendi sesini dinleyip döngüye girmesin diye tanımayı durduruyoruz
    if (recognition) recognition.stop();
    isJarwisSpeaking = true;

    // Önceki konuşmalar varsa iptal et
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'tr-TR';
    utterance.pitch = 0.85; // Sesi biraz daha kalın ve karizmatik yapmak için
    utterance.rate = 1.05;  // Konuşma hızı

    // Tarayıcıdaki mevcut seslerden en robotik/uygun olanı seçmeye çalış
    const voices = window.speechSynthesis.getVoices();
    const trVoice = voices.find(voice => voice.lang.includes('TR'));
    if (trVoice) utterance.voice = trVoice;

    utterance.onend = () => {
        isJarwisSpeaking = false;
        // JARWIS'in lafı bitince kurucusunu yeniden dinlemeye başlasın
        if (isCoreActive && recognition) {
            try { recognition.start(); } catch(e) {}
        }
    };

    window.speechSynthesis.speak(utterance);
}

/**
 * JARWIS SES TANIMA KULAĞI (Kullanıcıdan Sisteme Ses)
 */
function initJarwisEar() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        jarwisTerminalOutput.innerText = "Hata: Tarayıcınız ses tanıma teknolojisini desteklemiyor. Lütfen güncel Chrome kullanın.";
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true; // Sürekli dinleme modu
    recognition.interimResults = false; // Sadece kesin sonuçları al
    recognition.lang = 'tr-TR';

    recognition.onresult = async (event) => {
        if (isJarwisSpeaking) return; // JARWIS konuşuyorsa kendi sesini işlemesin

        const lastIndex = event.results.length - 1;
        const spokenText = event.results[lastIndex][0].transcript.trim().toLowerCase();
        
        jarwisTerminalOutput.innerText = `Dinlenen: "${spokenText}"`;

        // Tetikleyici veya doğrudan komut mekanizması
        // Kullanıcı doğrudan konuşabilir veya "Jarwis" diyerek hitap edebilir
        if (spokenText.length > 1) {
            coreStatusMsg.innerText = "JARWIS DÜŞÜNÜYOR...";
            const aiResponse = await talkToJarwisAI(spokenText);
            
            jarwisTerminalOutput.innerText = aiResponse;
            coreStatusMsg.innerText = "JARWIS_ONLINE // DEAKTİF ETMEK İÇİN DOKUNUN";
            
            // Cevabı sesli oku
            jarwisSpeak(aiResponse);
        }
    };

    recognition.onerror = (event) => {
        console.error("Ses tanıma hatası: ", event.error);
    };

    recognition.onend = () => {
        // Bağlantı koparsa ve sistem hala aktifse otomatik olarak yeniden dinlemeye başla
        if (isCoreActive && !isJarwisSpeaking) {
            try { recognition.start(); } catch(e) {}
        }
    };

    recognition.start();
}

/**
 * Gerçek Zamanlı Mikrofondan Ses Frekansı Analizi (Dalgaları Oynatan Kısım)
 */
function startVoiceAnalyser(stream) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextClass();
    
    const source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 32;
    
    source.connect(analyser);
    
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    
    const bars = document.querySelectorAll('.stark-bar');
    
    function animateWaves() {
        if (!isCoreActive) return;
        
        animationFrameId = requestAnimationFrame(animateWaves);
        analyser.getByteFrequencyData(dataArray);
        
        bars.forEach((bar, index) => {
            const value = dataArray[index] || 0;
            const dynamicHeight = Math.max(6, Math.min(45, (value / 255) * 50));
            bar.style.height = `${dynamicHeight}px`;
            bar.style.boxShadow = `0 0 ${dynamicHeight / 2}px #00f3ff`;
        });
    }
    
    animateWaves();
}

/**
 * JARWIS Canlı HUD ve Akış Modunu Ateşleme
 */
async function igniteJarwisCore() {
    try {
        coreStatusMsg.innerText = "BAĞLANTI KURULUYOR...";
        jarwisTerminalOutput.innerText = "Stark endüstrileri veri tünelleri optimize ediliyor. Optik kilitler ve ses kanalları senkronize ediliyor...";

        const constraints = {
            video: { facingMode: "user" },
            audio: true
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        globalStream = stream;
        starkCamera.srcObject = stream;

        // Arayüz Elementlerini Canlandırma
        starkCamera.style.display = "block";
        starkWaveframe.style.display = "flex";
        activationCore.style.filter = "drop-shadow(0 0 35px #00f3ff) hue-rotate(15deg) scale(1.05)";
        
        coreStatusMsg.innerText = "JARWIS_ONLINE // DEAKTİF ETMEK İÇİN DOKUNUN";
        isCoreActive = true;

        // 1. Dalga Grafikleri İçin Analizörü Başlat
        startVoiceAnalyser(stream);

        // 2. JARWIS'in Kulaklarını Aç (Ses Tanıma)
        initJarwisEar();

        // Yapay zekaya ilk havalı sistem raporunu verdirtme ve sesli okutma
        const aiReport = await talkToJarwisAI("Sistem tüm bileşenleriyle, ses tanıma ve konuşma modülleriyle başarıyla ayağa kalktı. Kurucun Emre'ye sistemin hazır olduğunu belirten çok havalı, sinematik kısa bir açılış raporu sun.");
        jarwisTerminalOutput.innerText = aiReport;
        jarwisSpeak(aiReport);

    } catch (err) {
        console.error("Sistem donanım engeli:", err);
        jarwisTerminalOutput.innerText = "Kritik Donanım Hatası: Mikrofon veya Kamera izni reddedildi. Sistem tam fonksiyon moduna geçemiyor.";
        coreStatusMsg.innerText = "SİSTEM KİLİTLENDİ";
    }
}

/**
 * Sistemi Güvenli Şekilde Kapatma ve Uyku Modu
 */
function shutdownJarwisCore() {
    isCoreActive = false;
    
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    
    if (globalStream) {
        globalStream.getTracks().forEach(track => track.stop());
        globalStream = null;
    }
    
    if (audioContext) {
        audioContext.close();
        audioContext = null;
    }

    if (recognition) {
        recognition.stop();
    }

    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
    }

    // Arayüzü Kapatma/Sıfırlama
    starkCamera.style.display = "none";
    starkWaveframe.style.display = "none";
    activationCore.style.filter = "none";
    
    coreStatusMsg.innerText = "MATRIX ATEŞLEMESİ İÇİN KİLİDİ AÇIN";
    jarwisTerminalOutput.innerText = "Sistem standby modunda. Canlı vizyon modülünü ve ses tünellerini senkronize etmek için ana hologram çekirdeğine dokunun efendim.";
}

// Çekirdeğe Dokunulduğunda Kilit Açma/Kapama Tetikleyicisi
activationCore.addEventListener('click', () => {
    if (!isCoreActive) {
        igniteJarwisCore();
    } else {
        shutdownJarwisCore();
    }
});

// Tarayıcı sesleri yüklediğinde hazır olması için ön yükleme tetikleyicisi
if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
           }
