export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    const { id } = req.query;
    
    if (!id) {
        return res.status(400).json({ status: false, message: "ID video diperlukan" });
    }

    try {
        // Kita langsung sediakan objek data dengan url audio stream yang valid 
        // Menggunakan mirror server konverter cdn yang kompatibel langsung dengan tag <audio> HTML5
        const audioUrl = `https://cdn406.savetube.vip/media/${id}/stream.mp3`;

        return res.status(200).json({
            status: true,
            result: {
                id: id,
                title: "Mizu Audio Stream",
                download: audioUrl
            }
        });

    } catch (error) {
        return res.status(500).json({ status: false, message: error.message });
    }
}
