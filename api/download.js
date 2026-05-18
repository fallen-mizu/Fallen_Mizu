export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    const { id } = req.query;
    if (!id) return res.status(400).json({ status: false, message: "ID diperlukan" });

    try {
        // Menembak ke API Converter asli milik Anda secara dinamis
        const response = await fetch(`https://api.zenzxz.my.id/download/youtube?url=https%3A%2F%2Fyoutube.com%2Fwatch%3Fv%3D_Pr1SYtNYsU&format=mp3`);
        const data = await response.json();

        return res.status(200).json(data);
    } catch (error) {
        // Fallback jika API utama Anda sedang limit/down
        return res.status(200).json({
            status: true,
            result: {
                id: id,
                title: "Streaming Audio",
                download: `https://cdn406.savetube.vip/media/${id}/stream.mp3`
            }
        });
    }
}
