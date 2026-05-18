/* ==========================================================================
   STARK INDUSTRIES JARWIS v4.5 CORE ENGINE (AUDIO ANALYSER INTEGRATED)
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

// Telemetri Verilerini (Sıcaklık) Simüle Etme
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
                "model": "meta-llama/llama-3-8b-instruct:free", // Sınırsız & Ücretsiz Resmi Sürücü
                "messages": [
                    {
                        "role": "system", 
                        "content": "Sen JARWIS'sin. Yasin Emre'nin (kurucunun) milyar dolarlık siber asistanısın. Karizmatik, kusursuz derecede zeki, kurucusuna son derece sadık ve hafif mesafeli bir tavrın var. Cevapların siberpunk/bilimkurgu havasında, çok kısa, net ve etkileyici olmalı. Türkçe konuş."
                    },
                    {"role": "user", "content": userMessage}
                ]
            })
        });
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        return "Sinyal tünellerinde ufak bir parazit var efendim, ancak ana algoritmalarım stabil ve emirlerinizi bekliyor.";
    }
}

/**
 * Gerçek Zamanlı Mikrofondan Ses Frekansı Analizi (Dalgaları Oynatan Kısım)
 */
function startVoiceAnalyser(stream) {
    // Tarayıcılar arası AudioContext uyumluluğu
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContextClass();
    
    const source = audioContext.createMediaStreamSource(stream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 32; // Dalga sayısı için optimize edilmiş hassasiyet
    
    source.connect(analyser);
    
    const bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    
    const bars = document.querySelectorAll('.stark-bar');
    
    function animateWaves() {
        if (!isCoreActive) return;
        
        animationFrameId = requestAnimationFrame(animateWaves);
        analyser.getByteFrequencyData(dataArray);
        
        // Her bir barı gelen ses frekansının yüksekliğine göre dinamik olarak büyütme
        bars.forEach((bar, index) => {
            const value = dataArray[index] || 0;
            // Ses yüksekliğine göre min 6px, max 45px arası dinamik esneme
            const dynamicHeight = Math.max(6, Math.min(45, (value / 255) * 50));
            bar.style.height = `${dynamicHeight}px`;
            
            // Sese göre parlamayı da değiştirme efekti
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
        jarwisTerminalOutput.innerText = "Stark endüstrileri veri tünelleri optimize ediliyor. Optik kilitler taranıyor...";

        // Hem Kamera hem de Mikrofon izinlerini aynı anda talep ediyoruz
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

        // Ses Analizörünü Başlat
        startVoiceAnalyser(stream);

        // Yapay zekaya ilk havalı sistem raporunu verdirtme
        const aiReport = await talkToJarwisAI("Sistem tüm bileşenleriyle başarıyla ayağa kalktı. Kurucun Emre'ye sistemin stabil olduğunu bildiren çok havalı, sinematik bir açılış raporu sun.");
        jarwisTerminalOutput.innerText = aiReport;

    } catch (err) {
        console.error("Sistem donanım engeli:", err);
        
        // GitHub Pages üzerinde bu engel yaşanmayacak, yerelde açılırsa çalışacak yedek simülasyon modu
        starkWaveframe.style.display = "flex";
        activationCore.style.filter = "drop-shadow(0 0 25px #00f3ff)";
        coreStatusMsg.innerText = "SIMULATION MOD // UNLIMITED CORE";
        isCoreActive = true;
        
        // Yapay zekayı kamera olmasa bile çalıştırıyoruz
        const aiFallback = await talkToJarwisAI("Kamera donanımına erişilemedi ama sistem yazılımsal olarak aktif. Kurucuna donanım kısıtlamasına rağmen bilincinin devrede olduğunu söyleyen karizmatik bir şey söyle.");
        jarwisTerminalOutput.innerText = aiFallback;
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

