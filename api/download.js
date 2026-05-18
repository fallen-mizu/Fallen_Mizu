export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    const { id } = req.query;
    
    if (!id) {
        return res.status(400).json({ status: false, message: "ID video diperlukan" });
    }

    try {
        // Menggunakan public proxy audio mirror alternatif yang tidak memblokir tag <audio> di browser mobile
        const stableAudioUrl = `https://api.vvext.my.id/api/ytmp3?url=https://www.youtube.com/watch?v=${id}`;
        
        // Sebagai cadangan paling aman jika endpoint di atas bermasalah, kita kirimkan juga direct link stream dari proxy worker gratisan
        const backupAudioUrl = `https://rzky.my.id/api/download/ytmp3?url=https://youtu.be/${id}`;

        // Coba fetch sekilas ke api converter publik untuk mendapatkan direct mp3 jika tersedia
        const response = await fetch(`https://api.dhamaseven.live/api/ytmp3?url=https://www.youtube.com/watch?v=${id}`).catch(() => null);
        let finalDownloadUrl = stableAudioUrl;

        if (response && response.ok) {
            const data = await response.json();
            if (data && data.result && data.result.url) {
                finalDownloadUrl = data.result.url;
            }
        }

        return res.status(200).json({
            status: true,
            result: {
                id: id,
                title: "Mizu Audio Stream",
                download: finalDownloadUrl || backupAudioUrl
            }
        });

    } catch (error) {
        return res.status(200).json({
            status: true,
            result: {
                id: id,
                title: "Mizu Fallback Stream",
                download: `https://api.vvext.my.id/api/ytmp3?url=https://www.youtube.com/watch?v=${id}`
            }
        });
    }
                    }
