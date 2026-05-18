export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    const { id } = req.query;
    if (!id) return res.status(400).json({ status: false, message: "ID diperlukan" });

    try {
        // Menggunakan server konversi publik berkecepatan tinggi
        // Browser Anda yang akan mengeksekusi tautan ini secara mandiri
        const downloadUrl = `https://api.zenkey.my.id/api/download/ytmp3?url=https://www.youtube.com/watch?v=${id}`;
        
        // Cadangan mirror server jika cdn di atas sibuk
        const backupUrl = `https://cdn406.savetube.vip/media/${id}/stream.mp3`;

        return res.status(200).json({
            status: true,
            result: {
                id: id,
                download: downloadUrl,
                fallback: backupUrl
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
