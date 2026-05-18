export default async function handler(req, res) {
    // Jalankan Header CORS agar diizinkan oleh browser
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    const { id } = req.query;
    if (!id) return res.status(400).json({ status: false, message: "ID diperlukan" });

    try {
        // 1. Panggil API Converter ZennzXD awal Anda secara dinamis memakai ID lagu
        const apiResponse = await fetch(`https://api.zenzxz.my.id/download/youtube?url=https%3A%2F%2Fyoutube.com%2Fwatch%3Fv%3D_Pr1SYtNYsU&format=mp3?id=${id}`);
        const data = await apiResponse.json();

        let targetUrl = "";

        if (data && data.status && data.result && data.result.download) {
            targetUrl = data.result.download;
        } else {
            // Fallback jika API utama gagal merespon id tertentu, tembak direct cdn savetube
            targetUrl = `https://cdn406.savetube.vip/media/${id}/stream.mp3`;
        }

        // 2. TAKTIK BOT WHATSAPP: Unduh file mp3 dari targetUrl sebagai Buffer Stream
        const audioFetch = await fetch(targetUrl);
        
        if (!audioFetch.ok) {
            throw new Error("Gagal mengambil file audio dari server source");
        }

        // Ambil arrayBuffer murni dari file audio
        const arrayBuffer = await audioFetch.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // 3. Set header respon persis seperti pengiriman media di bot WhatsApp
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=31536000');

        // Kirimkan buffer murni langsung ke browser
        return res.send(buffer);

    } catch (error) {
        console.error("Proxy Audio Error:", error);
        // Jika skema di atas crash, beri respon status error agar tidak membekukan browser
        return res.status(500).json({ status: false, message: "Gagal memproses streaming audio mpeg" });
    }
}
