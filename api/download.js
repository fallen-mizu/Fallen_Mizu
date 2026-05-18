export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    const { id } = req.query;
    if (!id) return res.status(400).json({ status: false, message: "ID diperlukan" });

    try {
        // Menggunakan endpoint converter publik alternatif yang responsif
        const response = await fetch(`https://api.zenkey.my.id/api/download/ytmp3?url=https://www.youtube.com/watch?v=${id}`).catch(() => null);
        
        let streamUrl = "";
        if (response && response.ok) {
            const data = await response.json();
            // Sesuaikan dengan struktur output API converter yang digunakan
            if (data && data.result && data.result.download_url) {
                streamUrl = data.result.download_url;
            }
        }

        // Jika API di atas gagal, gunakan direct cdn stream sebagai fallback utama
        if (!streamUrl) {
            streamUrl = `https://cdn406.savetube.vip/media/${id}/stream.mp3`;
        }

        return res.status(200).json({
            status: true,
            result: {
                id: id,
                download: streamUrl
            }
        });
    } catch (error) {
        return res.status(200).json({
            status: true,
            result: {
                id: id,
                download: `https://cdn406.savetube.vip/media/${id}/stream.mp3`
            }
        });
    }
}
